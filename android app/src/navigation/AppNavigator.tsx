import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DashboardScreen from '../screens/app/DashboardScreen';
import DevicesScreen from '../screens/app/DevicesScreen';
import DeviceDetailsScreen from '../screens/app/DeviceDetailsScreen';
import ActivityScreen from '../screens/app/ActivityScreen';
import SettingsScreen from '../screens/app/SettingsScreen';
import { ScreenshotGalleryScreen, WebcamGalleryScreen } from '../screens/app/GalleryScreens';
import CustomTabBar from './CustomTabBar';

const Tab = createBottomTabNavigator();
const DevicesStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();

function DevicesNavigator() {
    return (
        <DevicesStack.Navigator screenOptions={{ headerShown: false }}>
            <DevicesStack.Screen name="DevicesList" component={DevicesScreen} />
            <DevicesStack.Screen name="DeviceDetails" component={DeviceDetailsScreen} />
            <DevicesStack.Screen name="Screenshots" component={ScreenshotGalleryScreen} />
            <DevicesStack.Screen name="Webcam" component={WebcamGalleryScreen} />
        </DevicesStack.Navigator>
    );
}

function AppTabs() {
    return (
        <Tab.Navigator
            screenOptions={{ headerShown: false }}
            tabBar={(props) => <CustomTabBar {...props} />}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Devices" component={DevicesNavigator} />
            <Tab.Screen name="Activity" component={ActivityScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <AppStack.Navigator screenOptions={{ headerShown: false }}>
            <AppStack.Screen name="Tabs" component={AppTabs} />
        </AppStack.Navigator>
    );
}
