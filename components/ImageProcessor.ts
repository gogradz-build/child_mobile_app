import * as tf from '@tensorflow/tfjs';

export interface ProcessedImage {
  tensor: tf.Tensor;
  originalSize: { width: number; height: number };
  processedSize: { width: number; height: number };
}

export class ImageProcessor {
  
 
  static async processBase64ToTensor(
    base64Image: string,
    targetSize: number = 28,
    normalize: boolean = true
  ): Promise<ProcessedImage> {
    try {
      // Create image element from base64
      const imageElement = await ImageProcessor.createImageFromBase64(base64Image);
      
      // Convert to tensor
      let tensor = tf.browser.fromPixels(imageElement);
      
      const originalSize = {
        width: tensor.shape[1] as number,
        height: tensor.shape[0] as number,
      };
      
      // Convert to grayscale if needed
      if (tensor.shape[2] === 3 || tensor.shape[2] === 4) {
        // Convert RGBA/RGB to grayscale
        const [r, g, b] = tf.split(tensor, tensor.shape[2], 2);
        tensor = tf.add(tf.add(tf.mul(r, 0.299), tf.mul(g, 0.587)), tf.mul(b, 0.114));
      }
      
      // Resize to target size (28x28 for letter recognition)
      tensor = tf.image.resizeBilinear(
        tensor.expandDims(0) as tf.Tensor3D, 
        [targetSize, targetSize]
      );
      
      // Normalize pixel values
      if (normalize) {
        tensor = tf.div(tensor, 255.0);
      }
      
      // Reshape to model input format [1, 28, 28, 1]
      tensor = tensor.reshape([1, targetSize, targetSize, 1]);
      
      return {
        tensor,
        originalSize,
        processedSize: { width: targetSize, height: targetSize },
      };
    } catch (error) {
      console.error('Error processing image to tensor:', error);
      throw new Error('Failed to process image for model input');
    }
  }
  
  // Alternative processing for better letter recognition
  static async processForLetterRecognition(
    base64Image: string,
    options: {
      targetSize?: number;
      invertColors?: boolean;
      threshold?: boolean;
      thresholdValue?: number;
    } = {}
  ): Promise<ProcessedImage> {
    const {
      targetSize = 28,
      invertColors = false,
      threshold = true,
      thresholdValue = 0.5,
    } = options;
    
    try {
      let result = await ImageProcessor.processBase64ToTensor(base64Image, targetSize, true);
      let { tensor } = result;
      
      // Apply thresholding for binary image (better for letter recognition)
      if (threshold) {
        tensor = tf.where(
          tf.greater(tensor, thresholdValue),
          tf.ones(tensor.shape),
          tf.zeros(tensor.shape)
        );
      }
      
      // Invert colors if needed (black background, white letter -> white background, black letter)
      if (invertColors) {
        tensor = tf.sub(1, tensor);
      }
      
      return {
        ...result,
        tensor,
      };
    } catch (error) {
      console.error('Error in letter recognition processing:', error);
      throw error;
    }
  }
  
  // Create image element from base64 (for React Native web compatibility)
  private static createImageFromBase64(base64: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      
      // Add data URL prefix if not present
      const dataUrl = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
      img.src = dataUrl;
    });
  }
  
  // Create canvas-based processing for React Native
  static async processCanvasImage(
    canvasImageData: any,
    targetSize: number = 28
  ): Promise<tf.Tensor> {
    try {
      // This would work with react-native canvas
      // For now, return a mock tensor
      const tensor = tf.randomNormal([1, targetSize, targetSize, 1]);
      return tensor;
    } catch (error) {
      console.error('Canvas processing error:', error);
      throw error;
    }
  }
  
  // Helper to validate image dimensions and quality
  static validateImageForLetterRecognition(
    originalSize: { width: number; height: number },
    minSize: number = 100
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (originalSize.width < minSize || originalSize.height < minSize) {
      issues.push(`Image too small: ${originalSize.width}x${originalSize.height}. Minimum: ${minSize}x${minSize}`);
    }
    
    const aspectRatio = originalSize.width / originalSize.height;
    if (aspectRatio < 0.5 || aspectRatio > 2.0) {
      issues.push(`Unusual aspect ratio: ${aspectRatio.toFixed(2)}. Letters work best with roughly square images.`);
    }
    
    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}