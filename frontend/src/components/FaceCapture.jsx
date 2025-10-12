import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import toast from "react-hot-toast";

const FaceCapture = ({ onDescriptor }) => {
  const videoRef = useRef();
  const [loading, setLoading] = useState(true);
  const toastActive = useRef(false); // ✅ prevents duplicate toasts

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    };

    const startVideo = () => {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => (videoRef.current.srcObject = stream))
        .catch(() => toast.error("Camera access denied"));
    };

    loadModels().then(() => {
      setLoading(false);
      startVideo();
    });
  }, []);

  const captureFace = async () => {
    if (toastActive.current) return; // prevent duplicate toast
    toastActive.current = true;

    const detections = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections) {
      toast.error("❌ Face not detected. Please try again.");
      toastActive.current = false;
      return;
    }

    onDescriptor(Array.from(detections.descriptor));
    toast.success("✅ Face captured successfully!");

    // reset flag after small delay so user can capture again
    setTimeout(() => {
      toastActive.current = false;
    }, 100);
  };

  return (
    <div>
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        width="300" 
        height="220"
        aria-label="Camera feed for face capture"
      />
      <button
        type="button"
        className="mt-2 p-2 bg-blue-600 text-white rounded"
        onClick={captureFace}
        disabled={loading}
        aria-label="Capture face for attendance verification"
        aria-disabled={loading}
      >
        {loading ? "Loading..." : "Capture Face"}
      </button>
    </div>
  );
};

export default FaceCapture;
