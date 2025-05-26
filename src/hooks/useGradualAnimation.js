import { useKeyboardHandler } from "react-native-keyboard-controller";
import { useSharedValue } from "react-native-reanimated";


const OFFSET = 42

export const useGradualAnimation = (initialValue, duration = 500) => {
    const totalOffset = OFFSET; // Total offset for the animation
    const height = useSharedValue(totalOffset);

    useKeyboardHandler({
        onMove: (event) => {
            "worklet";
            // Calculate the new height based on the keyboard event
            const newHeight = Math.max(event.height + OFFSET, totalOffset);
            height.value = newHeight;
        },
    }, []);

    return { height };

}