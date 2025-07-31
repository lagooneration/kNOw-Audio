import { useFrame, useThree } from '@react-three/fiber';
import { updateListenerPosition } from '../../utils/spatial-audio-processing';

export function AudioListener() {
  const { camera } = useThree();
  
  useFrame(() => {
    const position = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    };
    
    // Calculate forward vector from camera
    const cameraDirection = camera.getWorldDirection(camera.getWorldDirection(camera.up.clone()));
    const forward = {
      x: cameraDirection.x,
      y: cameraDirection.y,
      z: cameraDirection.z
    };
    
    // Calculate up vector from camera
    const up = {
      x: camera.up.x,
      y: camera.up.y,
      z: camera.up.z
    };
    
    // Update the audio listener position and orientation
    updateListenerPosition(position, { forward, up });
  });
  
  return null;
}
