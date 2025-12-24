import { useEffect, useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useFaceModels } from "../context/FaceModelContext";

/**
 * FaceCapture Component
 * Captures face via webcam and extracts 128-dimensional face descriptor
 * Uses globally loaded face-api.js models from context
 * 
 * @param {function} onDescriptor - Callback function that receives the face descriptor array
 */
const FaceCapture = ({ onDescriptor }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraState, setCameraState] = useState({
    isLoading: true,
    hasPermission: false,
    error: null,
  });
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Get face models from global context
  const { isLoaded: modelsLoaded, isLoading: modelsLoading, faceapi, error: modelError } = useFaceModels();

  // Start video stream
  const startVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      
      setCameraState({
        isLoading: false,
        hasPermission: true,
        error: null,
      });
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraState({
        isLoading: false,
        hasPermission: false,
        error: err.name === "NotAllowedError" 
          ? "Camera access denied. Please allow camera permissions." 
          : "Failed to access camera. Please check your device.",
      });
      toast.error("Camera access denied");
    }
  }, []);

  // Stop video stream (cleanup)
  const stopVideo = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Initialize camera when models are loaded
  useEffect(() => {
    if (modelsLoaded && !streamRef.current) {
      startVideo();
    }
    
    // Cleanup: Stop camera stream when component unmounts
    return () => {
      stopVideo();
    };
  }, [modelsLoaded, startVideo, stopVideo]);

  // Capture face and extract descriptor
  const captureFace = async () => {
    if (!modelsLoaded || !faceapi || isCapturing) return;
    
    setIsCapturing(true);
    
    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        toast.error("Face not detected. Please ensure good lighting and face the camera.");
        return;
      }

      // Convert Float32Array to regular array
      const descriptor = Array.from(detections.descriptor);
      onDescriptor(descriptor);
      toast.success("Face captured successfully!");
    } catch (err) {
      console.error("Face capture error:", err);
      toast.error("Failed to capture face. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  };

  // Determine loading state
  const isLoading = modelsLoading || cameraState.isLoading;
  const hasError = modelError || cameraState.error;

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center p-4">
        <div className="w-[300px] h-[220px] bg-gray-800/50 border border-gray-700 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-gray-600 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-cyan-400 text-sm font-medium">
              {modelsLoading ? "Loading AI models..." : "Starting camera..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (hasError) {
    return (
      <div className="flex flex-col items-center p-4">
        <div className="w-[300px] h-[220px] bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center">
          <div className="text-center p-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-400 text-sm font-medium mb-3">
              {hasError}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setCameraState({ isLoading: true, hasPermission: false, error: null });
                startVideo();
              }}
              className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 text-sm rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Retry
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative rounded-xl overflow-hidden border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/10">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline
          width="300" 
          height="220"
          className="rounded-lg bg-gray-900"
          aria-label="Camera feed for face capture"
        />
        {/* Face guide overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 300 220">
            <defs>
              <linearGradient id="faceGuideGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <ellipse 
              cx="150" 
              cy="110" 
              rx="70" 
              ry="90" 
              fill="none" 
              stroke="url(#faceGuideGradient)" 
              strokeWidth="2"
              strokeDasharray="10,5"
            />
          </svg>
        </div>
        {/* Corner indicators */}
        <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-500 rounded-tl-lg"></div>
        <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-cyan-500 rounded-tr-lg"></div>
        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-cyan-500 rounded-bl-lg"></div>
        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-500 rounded-br-lg"></div>
      </div>
      
      <motion.button
        type="button"
        whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(6, 182, 212, 0.4)" }}
        whileTap={{ scale: 0.95 }}
        className={`mt-4 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
          isCapturing 
            ? "bg-gray-700 cursor-not-allowed text-gray-400" 
            : "bg-gradient-to-r from-cyan-500 to-purple-600 hover:shadow-lg shadow-cyan-500/30 text-white"
        }`}
        onClick={captureFace}
        disabled={isCapturing}
        aria-label="Capture face for attendance verification"
        aria-disabled={isCapturing}
      >
        {isCapturing ? (
          <>
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Capturing...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Capture Face</span>
          </>
        )}
      </motion.button>
      
      <p className="mt-3 text-xs text-gray-500 text-center max-w-[280px]">
        Position your face within the oval guide and ensure good lighting
      </p>
    </div>
  );
};

export default FaceCapture;
