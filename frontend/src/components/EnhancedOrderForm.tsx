'use client';

import { useState } from 'react';
import { Camera, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';

interface OrderFormProps {
  onSubmit: (orderData: any) => void;
  loading?: boolean;
}

export default function EnhancedOrderForm({ onSubmit, loading = false }: OrderFormProps) {
  const [sizeEvidenceImages, setSizeEvidenceImages] = useState<File[]>([]);
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'airtel_money' | 'cash_on_delivery'>('mobile_money');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Limit to 2 images as per requirements
    if (sizeEvidenceImages.length + files.length > 2) {
      alert('You can only upload up to 2 size evidence photos');
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!isValidType) {
        alert(`${file.name} is not a valid image file`);
        return false;
      }
      
      if (!isValidSize) {
        alert(`${file.name} is too large. Please select images under 5MB`);
        return false;
      }
      
      return true;
    });

    setSizeEvidenceImages(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setSizeEvidenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    
    setUploading(true);
    
    try {
      // In production, this would upload to a cloud storage service
      // For now, we'll simulate the upload and return mock URLs
      const uploadPromises = files.map(async (file) => {
        return new Promise<string>((resolve) => {
          setTimeout(() => {
            const mockUrl = `https://example.com/uploads/${Date.now()}_${file.name}`;
            resolve(mockUrl);
          }, 1000);
        });
      });
      
      const uploadedUrls = await Promise.all(uploadPromises);
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shippingAddress.trim()) {
      alert('Please provide a shipping address');
      return;
    }

    try {
      // Upload images first if any
      const imageUrls = await uploadImages(sizeEvidenceImages);
      
      const orderData = {
        shippingAddress: shippingAddress.trim(),
        paymentMethod,
        notes: notes.trim(),
        sizeEvidenceImages: imageUrls,
      };
      
      onSubmit(orderData);
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Failed to submit order. Please try again.');
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
      <h3 className="text-xl font-semibold text-white mb-6">Order Details</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shipping Address */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Shipping Address *
          </label>
          <textarea
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            placeholder="Enter your complete shipping address..."
            rows={3}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            required
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('mobile_money')}
              className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                paymentMethod === 'mobile_money'
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-white/20 bg-white/5 hover:border-white/30'
              }`}
            >
              <div className="text-center">
                <div className="text-yellow-400 text-sm font-semibold">MTN MoMo</div>
                <div className="text-gray-400 text-xs">*182#</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('airtel_money')}
              className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                paymentMethod === 'airtel_money'
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-white/20 bg-white/5 hover:border-white/30'
              }`}
            >
              <div className="text-center">
                <div className="text-red-400 text-sm font-semibold">Airtel Money</div>
                <div className="text-gray-400 text-xs">*500#</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('cash_on_delivery')}
              className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                paymentMethod === 'cash_on_delivery'
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-white/20 bg-white/5 hover:border-white/30'
              }`}
            >
              <div className="text-center">
                <div className="text-green-400 text-sm font-semibold">Cash</div>
                <div className="text-gray-400 text-xs">On Delivery</div>
              </div>
            </button>
          </div>
        </div>

        {/* Size Evidence Photos */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Size Evidence Photos (Optional)
          </label>
          <p className="text-gray-400 text-xs mb-3">
            Upload 1-2 photos to help the producer understand your size requirements
          </p>
          
          {/* Upload Area */}
          <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-white/30 transition-colors">
            <input
              type="file"
              id="size-evidence"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={sizeEvidenceImages.length >= 2}
            />
            
            {sizeEvidenceImages.length < 2 ? (
              <label htmlFor="size-evidence" className="cursor-pointer">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-white mb-2">Click to upload photos</p>
                <p className="text-gray-400 text-sm">
                  PNG, JPG up to 5MB each • Max 2 photos
                </p>
              </label>
            ) : (
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <p className="text-green-400">Maximum photos uploaded</p>
              </div>
            )}
          </div>

          {/* Uploaded Images Preview */}
          {sizeEvidenceImages.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {sizeEvidenceImages.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-white/10 rounded-xl overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Size evidence ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="text-xs text-gray-400 mt-1 truncate">{file.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions or requirements..."
            rows={3}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading || uploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {uploading ? 'Uploading Images...' : 'Processing Order...'}
            </>
          ) : (
            'Place Order'
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-blue-300 font-medium mb-1">Size Evidence Photos</h4>
            <p className="text-blue-200 text-sm">
              Adding photos helps producers better understand your size requirements and ensures a better fit. 
              This is optional but highly recommended for custom or fitted items.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
