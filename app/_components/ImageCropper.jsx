"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { ImageUploadService } from "@/utils/imageUploadService";

const ImageCropper = ({ 
  onImageSelected, 
  onImageUploaded, 
  currentImageUrl = null,
  autoUpload = false,
  cropperSize = 200,
  title = "Profile Picture",
  description = "Choose a photo for your profile"
}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    size: 200
  });
  
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const modalRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 350, height: 350 });
  const [imageInfo, setImageInfo] = useState({ 
    width: 0, 
    height: 0, 
    scale: 1,
    displayWidth: 0,
    displayHeight: 0
  });

  // Calculate responsive container size
  useEffect(() => {
    const updateContainerSize = () => {
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      
      if (vw <= 480) {
        // Mobile phones
        setContainerSize({ width: Math.min(300, vw - 40), height: Math.min(300, vh * 0.4) });
      } else if (vw <= 768) {
        // Tablets
        setContainerSize({ width: 350, height: 350 });
      } else {
        // Desktop
        setContainerSize({ width: 400, height: 400 });
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    
    return () => window.removeEventListener('resize', updateContainerSize);
  }, []);

  const handleFileSelect = useCallback(async (file) => {
    const validation = ImageUploadService.validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    try {
      const imageUrl = await ImageUploadService.createImagePreview(file);
      setSelectedImage({ file, url: imageUrl });
      setShowCropper(true);
    } catch (error) {
      toast.error("Failed to load image");
    }
  }, []);

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const calculateOptimalCrop = useCallback((imgWidth, imgHeight, containerWidth, containerHeight) => {
    const scaleX = containerWidth / imgWidth;
    const scaleY = containerHeight / imgHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const displayWidth = imgWidth * scale;
    const displayHeight = imgHeight * scale;
    
    const maxCropSize = Math.min(displayWidth, displayHeight, containerWidth * 0.8, containerHeight * 0.8);
    
    const cropX = Math.max(0, (displayWidth - maxCropSize) / 2);
    const cropY = Math.max(0, (displayHeight - maxCropSize) / 2);
    
    return {
      scale,
      displayWidth,
      displayHeight,
      cropX,
      cropY,
      cropSize: maxCropSize
    };
  }, []);

  const handleImageLoad = () => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const { width: containerWidth, height: containerHeight } = containerSize;
      
      const optimal = calculateOptimalCrop(
        img.naturalWidth, 
        img.naturalHeight, 
        containerWidth, 
        containerHeight
      );
      
      setImageInfo({
        width: img.naturalWidth,
        height: img.naturalHeight,
        scale: optimal.scale,
        displayWidth: optimal.displayWidth,
        displayHeight: optimal.displayHeight
      });
      
      setCropData({
        x: optimal.cropX,
        y: optimal.cropY,
        size: optimal.cropSize
      });
    }
  };

  // Get pointer position (mouse or touch)
  const getPointerPosition = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = (e, type = 'drag') => {
    e.preventDefault();
    e.stopPropagation();
    
    const position = getPointerPosition(e);
    
    if (type === 'drag') {
      setIsDragging(true);
      setDragStart({
        x: position.x - cropData.x,
        y: position.y - cropData.y
      });
    } else if (type === 'resize') {
      setIsResizing(true);
      setDragStart({
        x: position.x,
        y: position.y,
        size: cropData.size
      });
    }
  };

  const handlePointerMove = useCallback((e) => {
    e.preventDefault();
    const position = getPointerPosition(e);
    
    if (isDragging && imageInfo.displayWidth && imageInfo.displayHeight) {
      const newX = position.x - dragStart.x;
      const newY = position.y - dragStart.y;
      
      const maxX = Math.max(0, imageInfo.displayWidth - cropData.size);
      const maxY = Math.max(0, imageInfo.displayHeight - cropData.size);
      
      setCropData(prev => ({
        ...prev,
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      }));
    } else if (isResizing && dragStart.size && imageInfo.displayWidth && imageInfo.displayHeight) {
      const deltaX = position.x - dragStart.x;
      const deltaY = position.y - dragStart.y;
      const delta = Math.max(deltaX, deltaY);
      
      let newSize = dragStart.size + delta;
      
      const maxSizeX = imageInfo.displayWidth - cropData.x;
      const maxSizeY = imageInfo.displayHeight - cropData.y;
      const maxSize = Math.min(maxSizeX, maxSizeY, imageInfo.displayWidth, imageInfo.displayHeight, containerSize.width * 0.9, containerSize.height * 0.9);
      const minSize = Math.min(50, containerSize.width * 0.2);
      
      newSize = Math.max(minSize, Math.min(newSize, maxSize || minSize));
      
      if (!isNaN(newSize) && newSize > 0) {
        setCropData(prev => ({
          ...prev,
          size: newSize
        }));
      }
    }
  }, [isDragging, isResizing, dragStart, cropData, imageInfo, containerSize]);

  const handlePointerUp = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Handle modal backdrop clicks
  const handleModalClick = (e) => {
    if (modalRef.current && e.target === modalRef.current) {
      setShowCropper(false);
    }
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      // Prevent scrolling and other touch behaviors
      const options = { passive: false };
      
      document.addEventListener('mousemove', handlePointerMove, options);
      document.addEventListener('mouseup', handlePointerUp);
      document.addEventListener('touchmove', handlePointerMove, options);
      document.addEventListener('touchend', handlePointerUp);
      
      // Prevent body scrolling on mobile
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('mousemove', handlePointerMove);
        document.removeEventListener('mouseup', handlePointerUp);
        document.removeEventListener('touchmove', handlePointerMove);
        document.removeEventListener('touchend', handlePointerUp);
        document.body.style.overflow = '';
      };
    }
  }, [isDragging, isResizing, handlePointerMove, handlePointerUp]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showCropper) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [showCropper]);

  const cropImage = async () => {
    if (!selectedImage || !imageRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const outputSize = 400;
    canvas.width = outputSize;
    canvas.height = outputSize;

    const img = imageRef.current;
    
    const sourceX = (cropData.x / imageInfo.scale);
    const sourceY = (cropData.y / imageInfo.scale);
    const sourceSize = (cropData.size / imageInfo.scale);

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      outputSize,
      outputSize
    );

    canvas.toBlob(async (blob) => {
      if (blob) {
        const croppedFile = new File([blob], `cropped-${selectedImage.file.name}`, {
          type: selectedImage.file.type
        });
        
        const croppedUrl = URL.createObjectURL(blob);
        setCroppedImage({ file: croppedFile, url: croppedUrl });
        
        if (onImageSelected) {
          onImageSelected(croppedFile, croppedUrl);
        }

        if (autoUpload) {
          setIsUploading(true);
          try {
            const result = await ImageUploadService.uploadToCPanel(croppedFile);
            
            if (result.success) {
              toast.success("Image uploaded successfully!");
              if (onImageUploaded) {
                onImageUploaded(result.filePath, result.url);
              }
            } else {
              toast.error(result.error);
            }
          } catch (error) {
            toast.error("Failed to upload image");
          } finally {
            setIsUploading(false);
          }
        }
        
        setShowCropper(false);
      }
    }, selectedImage.file.type, 0.9);
  };

  const handleUpload = async () => {
    if (!croppedImage) return;

    setIsUploading(true);
    try {
      const result = await ImageUploadService.uploadToCPanel(croppedImage.file);
      
      if (result.success) {
        toast.success("Image uploaded successfully!");
        if (onImageUploaded) {
          onImageUploaded(result.filePath, result.url);
        }
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const resetCropper = () => {
    setSelectedImage(null);
    setCroppedImage(null);
    setShowCropper(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayCropperSize = Math.min(cropperSize/3, 80);

  return (
    <div className="w-full space-y-4">
      <div className="text-center px-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-xs sm:text-sm text-gray-600">{description}</p>
      </div>

      {/* Current/Cropped Image Display */}
      <div className="flex justify-center px-4">
        <div className="relative">
          <div 
            className="rounded-full border-4 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center shadow-sm"
            style={{ width: displayCropperSize, height: displayCropperSize }}
          >
            {croppedImage?.url || currentImageUrl ? (
              <img 
                src={croppedImage?.url || currentImageUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            )}
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 p-1.5 sm:p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg touch-manipulation"
          >
            <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Image Cropper Modal */}
      {showCropper && selectedImage && (
        <div 
          ref={modalRef}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={handleModalClick}
          style={{ touchAction: 'none' }}
        >
          <div 
            className="bg-white rounded-lg p-3 sm:p-6 w-full max-w-sm sm:max-w-lg mx-auto max-h-screen overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Crop Your Image</h3>
              <button
                onClick={() => setShowCropper(false)}
                className="p-1 hover:bg-gray-100 rounded touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-3 sm:mb-4">
              <div 
                ref={containerRef}
                className="relative mx-auto bg-gray-100 overflow-hidden border-2 border-gray-200 rounded-lg touch-none"
                style={{ 
                  width: containerSize.width, 
                  height: containerSize.height,
                  touchAction: 'none'
                }}
              >
                <img
                  ref={imageRef}
                  src={selectedImage.url}
                  alt="Crop preview"
                  className="absolute top-0 left-0 max-w-none pointer-events-none select-none"
                  style={{
                    width: imageInfo.displayWidth,
                    height: imageInfo.displayHeight,
                    transform: `translate(${(containerSize.width - imageInfo.displayWidth) / 2}px, ${(containerSize.height - imageInfo.displayHeight) / 2}px)`
                  }}
                  onLoad={handleImageLoad}
                  draggable={false}
                />
                
                {/* Crop Overlay */}
                {imageInfo.displayWidth && imageInfo.displayHeight && (
                  <div
                    className="absolute border-2 border-white shadow-lg cursor-move select-none touch-manipulation"
                    style={{
                      left: Math.max(0, (containerSize.width - imageInfo.displayWidth) / 2 + cropData.x),
                      top: Math.max(0, (containerSize.height - imageInfo.displayHeight) / 2 + cropData.y),
                      width: cropData.size || 200,
                      height: cropData.size || 200,
                      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.8), 0 4px 12px rgba(0, 0, 0, 0.3)',
                      touchAction: 'none'
                    }}
                    onMouseDown={(e) => handlePointerDown(e, 'drag')}
                    onTouchStart={(e) => handlePointerDown(e, 'drag')}
                  >
                    {/* Grid guides */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute left-1/3 top-0 bottom-0 w-0 border-l border-dashed border-white/70"></div>
                      <div className="absolute left-2/3 top-0 bottom-0 w-0 border-l border-dashed border-white/70"></div>
                      <div className="absolute top-1/3 left-0 right-0 h-0 border-t border-dashed border-white/70"></div>
                      <div className="absolute top-2/3 left-0 right-0 h-0 border-t border-dashed border-white/70"></div>
                    </div>
                    
                    {/* Circular guide */}
                    <div className="absolute inset-1 rounded-full border border-dotted border-pink-300/80 pointer-events-none"></div>
                    
                    {/* Center crosshair */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-4 sm:w-6 h-0.5 bg-white/80 absolute -translate-x-1/2"></div>
                      <div className="h-4 sm:h-6 w-0.5 bg-white/80 absolute -translate-y-1/2"></div>
                    </div>
                    
                    {/* Corner indicators */}
                    <div className="absolute top-0 left-0 w-2 sm:w-3 h-2 sm:h-3 border-l-2 border-t-2 border-blue-400 pointer-events-none"></div>
                    <div className="absolute top-0 right-0 w-2 sm:w-3 h-2 sm:h-3 border-r-2 border-t-2 border-blue-400 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-2 sm:w-3 h-2 sm:h-3 border-l-2 border-b-2 border-blue-400 pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-2 sm:w-3 h-2 sm:h-3 border-r-2 border-b-2 border-blue-400 pointer-events-none"></div>
                    
                    {/* Resize handle */}
                    <div 
                      className="absolute w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 border-2 border-white rounded-full cursor-se-resize shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors touch-manipulation"
                      style={{ 
                        bottom: '-12px',
                        right: '-12px',
                        touchAction: 'none'
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handlePointerDown(e, 'resize');
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        handlePointerDown(e, 'resize');
                      }}
                    >
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 border border-white rounded-full"></div>
                    </div>
                  </div>
                )}
                
                {/* Dark overlay with circular cutout */}
                {imageInfo.displayWidth && imageInfo.displayHeight && (
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at ${Math.max(0, (containerSize.width - imageInfo.displayWidth) / 2 + cropData.x + (cropData.size || 200)/2)}px ${Math.max(0, (containerSize.height - imageInfo.displayHeight) / 2 + cropData.y + (cropData.size || 200)/2)}px, transparent ${(cropData.size || 200)/2}px, rgba(0,0,0,0.6) ${(cropData.size || 200)/2 + 1}px)`
                    }}
                  ></div>
                )}
              </div>
            </div>

            <div className="text-center text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 px-2">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
              Drag to position, use handle to resize
            </div>

            <div className="flex gap-2 sm:gap-3">
              <Button
                onClick={() => setShowCropper(false)}
                variant="outline"
                className="flex-1 text-xs sm:text-sm py-2 touch-manipulation"
              >
                Cancel
              </Button>
              <Button
                onClick={cropImage}
                disabled={isUploading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm py-2 touch-manipulation"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    {autoUpload ? "Crop & Upload" : "Crop Image"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {!autoUpload && croppedImage && (
        <div className="text-center px-4">
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="bg-blue-600 hover:bg-blue-700 text-sm touch-manipulation"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageCropper;