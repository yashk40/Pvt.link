import admin from 'firebase-admin';
import 'dotenv/config';
import crypto from 'crypto';

const required = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  throw new Error(`Missing Firebase environment variable(s): ${missing.join(', ')}`);
}

const credential = admin.credential.cert({
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
});

if (!admin.apps.length) admin.initializeApp({ credential });

const realDb = admin.firestore();

// --- IN-MEMORY FALLBACK FIRESTORE EMULATION ---
let fallbackActive = false;
const memStore = {};

function getMemCollection(name) {
  if (!memStore[name]) memStore[name] = new Map();
  return memStore[name];
}

class MockTimestamp {
  constructor(date = new Date()) {
    this.date = date;
    this.seconds = Math.floor(date.getTime() / 1000);
    this.nanoseconds = (date.getTime() % 1000) * 1e6;
  }
  toMillis() {
    return this.date.getTime();
  }
  toDate() {
    return this.date;
  }
}

class MemDocRef {
  constructor(collectionName, id) {
    this.collectionName = collectionName;
    this.id = id || crypto.randomUUID();
  }

  async get() {
    const col = getMemCollection(this.collectionName);
    const data = col.get(this.id);
    return {
      exists: !!data,
      id: this.id,
      ref: this,
      data: () => data ? JSON.parse(JSON.stringify(data)) : undefined
    };
  }

  async set(data, options = {}) {
    const col = getMemCollection(this.collectionName);
    const existing = col.get(this.id) || {};
    let finalData = {};
    if (options.merge) {
      finalData = mergeDeep(existing, data);
    } else {
      finalData = { ...data };
    }
    finalData = processFieldValues(finalData, existing);
    col.set(this.id, finalData);
    return this;
  }

  async update(data) {
    const col = getMemCollection(this.collectionName);
    const existing = col.get(this.id);
    if (!existing) throw new Error(`Document ${this.id} not found in ${this.collectionName}`);
    const updated = processFieldValues(mergeDeep(existing, data), existing);
    col.set(this.id, updated);
    return this;
  }

  async delete() {
    const col = getMemCollection(this.collectionName);
    col.delete(this.id);
    return this;
  }
}

class MemQuery {
  constructor(collectionName, filters = [], limitVal = null) {
    this.collectionName = collectionName;
    this.filters = filters;
    this.limitVal = limitVal;
  }

  where(field, op, val) {
    return new MemQuery(this.collectionName, [...this.filters, { field, op, val }], this.limitVal);
  }

  limit(num) {
    return new MemQuery(this.collectionName, this.filters, num);
  }

  async get() {
    const col = getMemCollection(this.collectionName);
    let docs = Array.from(col.entries()).map(([id, data]) => ({
      id,
      data: () => JSON.parse(JSON.stringify(data))
    }));

    // Apply filters
    for (const filter of this.filters) {
      const { field, op, val } = filter;
      docs = docs.filter(doc => {
        const docVal = doc.data()[field];
        if (op === '==') return docVal === val;
        if (op === 'array-contains') return Array.isArray(docVal) && docVal.includes(val);
        return true;
      });
    }

    if (this.limitVal !== null) {
      docs = docs.slice(0, this.limitVal);
    }

    return {
      empty: docs.length === 0,
      docs: docs.map(d => ({
        id: d.id,
        ref: new MemDocRef(this.collectionName, d.id),
        exists: true,
        data: d.data
      }))
    };
  }
}

class MemCollectionRef extends MemQuery {
  constructor(name) {
    super(name);
  }

  doc(id) {
    return new MemDocRef(this.collectionName, id);
  }

  async add(data) {
    const id = crypto.randomUUID();
    const docRef = new MemDocRef(this.collectionName, id);
    await docRef.set(data);
    return docRef;
  }
}

function processFieldValues(obj, existingObj = {}) {
  if (!obj || typeof obj !== 'object') return obj;
  const processed = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (value && value._type === 'serverTimestamp') {
      processed[key] = new MockTimestamp();
    } else if (value && value._type === 'arrayUnion') {
      const existingArray = Array.isArray(existingObj[key]) ? existingObj[key] : [];
      processed[key] = [...new Set([...existingArray, ...value.values])];
    } else if (value && typeof value.toMillis === 'function') {
      processed[key] = value;
    } else if (value && typeof value === 'object') {
      processed[key] = processFieldValues(value, existingObj[key]);
    } else {
      processed[key] = value;
    }
  }
  return processed;
}

function mergeDeep(target, source) {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) Object.assign(output, { [key]: source[key] });
        else output[key] = mergeDeep(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

// Interceptor helper
function isQuotaError(err) {
  return err && (err.code === 8 || /quota exceeded|resource exhausted|rate limit|too many requests/i.test(err.message || ''));
}

function wrapCall(targetFn, fallbackFn) {
  return async function(...args) {
    if (fallbackActive) {
      return fallbackFn(...args);
    }
    // The Firestore gRPC client retries RESOURCE_EXHAUSTED (quota) in an
    // exponential-backoff loop that can hang the request indefinitely instead
    // of surfacing the error — so the quota fallback below never engages. Bound
    // every real call with a timeout so a stalled/unreachable/quota-exhausted
    // Firestore fails fast and the resilient in-memory store takes over.
    const timeoutMs = 5000;
    try {
      return await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('FIRESTORE_TIMEOUT')), timeoutMs);
        Promise.resolve().then(() => targetFn(...args)).then(
          (value) => { clearTimeout(timer); resolve(value); },
          (error) => { clearTimeout(timer); reject(error); }
        );
      });
    } catch (err) {
      if (isQuotaError(err) || err.message === 'FIRESTORE_TIMEOUT') {
        console.warn('⚠️ FIRESTORE UNAVAILABLE (quota/timeout). Switching backend to resilient in-memory fallback storage mode.');
        fallbackActive = true;
        return fallbackFn(...args);
      }
      throw err;
    }
  };
}

// Proxy wrapper for Firebase collection calls
class WrappedDb {
  collection(name) {
    const realCol = realDb.collection(name);
    const memCol = new MemCollectionRef(name);

    return {
      doc: (id) => {
        // `doc()` with no argument asks Firestore for an auto-generated id.
        // The real client generates one lazily, but it rejects an explicit
        // `undefined`, so mint one here and use it for both stores.
        const docId = id || crypto.randomUUID();
        const realDoc = realCol.doc(docId);
        const memDoc = memCol.doc(docId);

        return {
          id: docId,
          get: wrapCall(() => realDoc.get(), () => memDoc.get()),
          set: wrapCall((data, opts) => realDoc.set(data, opts), (data, opts) => memDoc.set(data, opts)),
          update: wrapCall((data) => realDoc.update(data), (data) => memDoc.update(data)),
          delete: wrapCall(() => realDoc.delete(), () => memDoc.delete())
        };
      },
      add: wrapCall((data) => realCol.add(data), (data) => memCol.add(data)),
      where: (field, op, val) => {
        let realQuery = realCol.where(field, op, val);
        let memQuery = memCol.where(field, op, val);

        const buildQueryObject = (rq, mq) => ({
          where: (f, o, v) => buildQueryObject(rq.where(f, o, v), mq.where(f, o, v)),
          limit: (num) => buildQueryObject(rq.limit(num), mq.limit(num)),
          get: wrapCall(() => rq.get(), () => mq.get())
        });

        return buildQueryObject(realQuery, memQuery);
      }
    };
  }
}

export const db = new WrappedDb();

// These are used to BUILD documents that later get written through db, which
// routes to either real Firestore or the in-memory fallback. They must produce
// the right object for whichever store is active at write time — real
// Firestore rejects MockTimestamp instances ("Couldn't serialize object of
// type MockTimestamp"), and the fallback rejects real Firestore sentinels.
// fallbackActive never flips back to false within a process run, so whatever
// mode a value is built for is still the mode when the write happens.
export const FieldValue = {
  serverTimestamp: () => (fallbackActive ? { _type: 'serverTimestamp' } : admin.firestore.FieldValue.serverTimestamp()),
  arrayUnion: (...values) => (fallbackActive ? { _type: 'arrayUnion', values } : admin.firestore.FieldValue.arrayUnion(...values))
};

export const Timestamp = {
  now: () => (fallbackActive ? new MockTimestamp() : admin.firestore.Timestamp.now()),
  fromDate: (date) => (fallbackActive ? new MockTimestamp(date) : admin.firestore.Timestamp.fromDate(date)),
  fromMillis: (ms) => (fallbackActive ? new MockTimestamp(new Date(ms)) : admin.firestore.Timestamp.fromMillis(ms))
};

export default admin;
