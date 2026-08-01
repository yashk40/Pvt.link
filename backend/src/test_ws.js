import WebSocket from 'ws';

const ws = new WebSocket('wss://pvtlink-worker.ykumawat006-372.workers.dev/ws/b3c3cdd8-76c1-4477-81ce-3dc6c7d2fa1e');

ws.on('open', () => {
  console.log('Connected.');
  ws.send(JSON.stringify({
    type: 'command:acknowledge',
    payload: {
      commandId: 'e22b7f92-9153-4736-acd5-c5ecf6e4e569',
      status: 'completed',
      result: { message: 'Test result' }
    }
  }));
  console.log('Sent acknowledge.');
  
  setTimeout(() => ws.close(), 3000);
});

ws.on('message', (data) => {
  console.log('Message from server:', data.toString());
});

ws.on('error', (err) => {
  console.error('Error:', err);
});
