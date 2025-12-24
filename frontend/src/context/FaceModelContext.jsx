import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';

const FaceModelContext = createContext(null);

const MODEL_URL = '/models';

/**
 * FaceModelProvider - Loads face-api.js models once globally
 * This prevents reloading ~35MB of models every time FaceCapture mounts
 */
export function FaceModelProvider({ children }) {
  const [state, setState] = useState({
    isLoaded: false,
    isLoading: false,
    error: null,
    loadProgress: 0,
  });

  const loadModels = useCallback(async () => {
    if (state.isLoaded || state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Load models in sequence with progress tracking
      setState(prev => ({ ...prev, loadProgress: 10 }));
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      
      setState(prev => ({ ...prev, loadProgress: 40 }));
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      
      setState(prev => ({ ...prev, loadProgress: 70 }));
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      
      setState({
        isLoaded: true,
        isLoading: false,
        error: null,
        loadProgress: 100,
      });
      
      console.log('✅ Face recognition models loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load face models:', error);
      setState({
        isLoaded: false,
        isLoading: false,
        error: error.message || 'Failed to load face recognition models',
        loadProgress: 0,
      });
    }
  }, [state.isLoaded, state.isLoading]);

  // Load models on mount
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const value = {
    ...state,
    loadModels, // Expose for manual reload if needed
    faceapi,    // Expose faceapi for detection
  };

  return (
    <FaceModelContext.Provider value={value}>
      {children}
    </FaceModelContext.Provider>
  );
}

/**
 * Hook to access face model context
 */
export function useFaceModels() {
  const context = useContext(FaceModelContext);
  if (!context) {
    throw new Error('useFaceModels must be used within a FaceModelProvider');
  }
  return context;
}

export default FaceModelContext;

