# TODOS

## TODO 1: Native 128D Face Descriptors via TFLite

- **What:** Bundle TFLite FaceNet/ArcFace model for native face embedding extraction
- **Why:** ML Kit provides no face descriptor. Celebrity mode's "Neural Similarity" gauge shows 0% on native without this.
- **Pros:** Full feature parity with web, better celebrity matching accuracy on native
- **Cons:** +10MB bundle size, TFLite integration complexity, separate from ML Kit pipeline
- **Context:** Web uses face-api.js faceRecognitionNet which returns 128D Float32Array descriptors. Native ML Kit only returns landmarks and contours. To get descriptors on native, need to bundle a separate TFLite face recognition model (FaceNet or ArcFace), load it via `@tensorflow/tfflite-react-native` or a custom native module, and run inference on cropped face images after ML Kit detection.
- **Depends on:** Phase 4 (native ML Kit detection must be working first)
- **Priority:** Medium — landmark-only scoring is functional for v1

## TODO 2: Service Worker for Offline Web Model Caching

- **What:** Add a service worker to pre-cache face-api.js models for guaranteed offline web use
- **Why:** Browser HTTP cache handles repeat visits, but a SW guarantees offline availability
- **Depends on:** Phase 2 web detection working
- **Priority:** Low — browser cache is sufficient for v1
