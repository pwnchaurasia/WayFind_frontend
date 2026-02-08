import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/src/styles/theme';

const ToastContext = createContext({});

export const ToastProvider = ({ children }) => {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info'); // 'success', 'error', 'info', 'warning'

    // Start off-screen (-100)
    const slideAnim = useRef(new Animated.Value(-100)).current;

    const showToast = (msg, toastType = 'info') => {
        setMessage(msg);
        setType(toastType);
        setVisible(true);
    };

    const hideToast = () => {
        Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true
        }).start(() => setVisible(false));
    };

    useEffect(() => {
        if (visible) {
            // Reset and start animation sequence
            slideAnim.stopAnimation();
            slideAnim.setValue(-100);

            Animated.sequence([
                Animated.timing(slideAnim, {
                    toValue: 60, // Slide down
                    duration: 300,
                    useNativeDriver: true
                }),
                Animated.delay(3000), // Wait
                Animated.timing(slideAnim, {
                    toValue: -100, // Slide up
                    duration: 300,
                    useNativeDriver: true
                })
            ]).start(({ finished }) => {
                if (finished) setVisible(false);
            });
        }
    }, [visible, message, type]);

    const getToastStyle = () => {
        switch (type) {
            case 'success': return { bg: '#00C853', icon: 'check-circle', color: '#fff' };
            case 'error': return { bg: '#FF5252', icon: 'alert-circle', color: '#fff' };
            case 'warning': return { bg: '#FFB300', icon: 'alert-triangle', color: '#fff' };
            default: return { bg: '#333', icon: 'bell', color: '#fff' }; // Info
        }
    };

    const styleConfig = getToastStyle();

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            {visible && (
                <Animated.View style={[
                    styles.toastContainer,
                    { transform: [{ translateY: slideAnim }] }
                ]}>
                    <View style={[styles.toast, { backgroundColor: styleConfig.bg }]}>
                        <Feather name={styleConfig.icon} size={20} color={styleConfig.color} />
                        <Text style={[styles.toastText, { color: styleConfig.color }]}>{message}</Text>
                    </View>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999, // Ensure it's on top of everything
        elevation: 10,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        gap: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
        minWidth: 200,
        maxWidth: '90%',
        justifyContent: 'center'
    },
    toastText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center'
    }
});
