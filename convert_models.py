#!/usr/bin/env python3
"""
Script to convert TensorFlow Lite models to TensorFlow.js format
Run this script to convert your .tflite models to .json/.bin format for use in React Native
"""

import os
import subprocess
import sys

def install_tensorflowjs():
    """Install tensorflowjs converter if not already installed"""
    try:
        import tensorflowjs
        print("✅ TensorFlow.js converter already installed")
    except ImportError:
        print("📦 Installing TensorFlow.js converter...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "tensorflowjs"])
        print("✅ TensorFlow.js converter installed successfully")

def convert_model(input_path, output_path, quantize_float16=False):
    """Convert a TensorFlow Lite model to TensorFlow.js format"""
    if not os.path.exists(input_path):
        print(f"❌ Input file not found: {input_path}")
        return False
    
    # Create output directory if it doesn't exist
    os.makedirs(output_path, exist_ok=True)
    
    # Build the conversion command
    cmd = [
        "tensorflowjs_converter",
        "--input_format=tf_lite",
        "--output_format=tfjs_graph_model",
        input_path,
        output_path
    ]
    
    if quantize_float16:
        cmd.insert(-2, "--quantize_float16")
    
    print(f"🔄 Converting {input_path} to {output_path}...")
    print(f"Command: {' '.join(cmd)}")
    
    try:
        subprocess.check_call(cmd)
        print(f"✅ Successfully converted {input_path}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Conversion failed: {e}")
        return False

def main():
    print("🚀 TensorFlow Lite to TensorFlow.js Converter")
    print("=" * 50)
    
    # Install required packages
    install_tensorflowjs()
    
    # Define model paths
    models_dir = "assets/models"
    fp16_model = os.path.join(models_dir, "letters_fp16.tflite")
    fp32_model = os.path.join(models_dir, "letters_fp32.tflite")
    
    # Convert fp16 model
    if os.path.exists(fp16_model):
        print(f"\n📱 Converting FP16 model...")
        success = convert_model(
            fp16_model, 
            os.path.join(models_dir, "letters_fp16"), 
            quantize_float16=True
        )
        if success:
            print("✅ FP16 model converted successfully")
        else:
            print("❌ FP16 model conversion failed")
    else:
        print(f"⚠️ FP16 model not found: {fp16_model}")
    
    # Convert fp32 model
    if os.path.exists(fp32_model):
        print(f"\n📱 Converting FP32 model...")
        success = convert_model(
            fp32_model, 
            os.path.join(models_dir, "letters_fp32"), 
            quantize_float16=False
        )
        if success:
            print("✅ FP32 model converted successfully")
        else:
            print("❌ FP32 model conversion failed")
    else:
        print(f"⚠️ FP32 model not found: {fp32_model}")
    
    print("\n🎉 Conversion process completed!")
    print("\nNext steps:")
    print("1. The converted models are now in assets/models/letters_fp16/ and assets/models/letters_fp32/")
    print("2. Update your React Native code to load the converted models")
    print("3. Use tf.loadLayersModel() with the path to model.json")

if __name__ == "__main__":
    main()
