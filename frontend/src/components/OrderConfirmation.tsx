'use client';

import { useState } from 'react';
import { CheckCircle, Package, Truck, AlertCircle, Star } from 'lucide-react';

interface OrderConfirmationProps {
  order: {
    id: string;
    status: string;
    isConfirmedByCustomer: boolean;
    customerConfirmationDate?: string;
    trackingNumber?: string;
    createdAt: string;
  };
  onConfirmReceipt: (orderId: string) => void;
  loading?: boolean;
}

export default function OrderConfirmation({ order, onConfirmReceipt, loading = false }: OrderConfirmationProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  const canConfirmReceipt = order.status === 'delivered' && !order.isConfirmedByCustomer;

  const handleConfirmReceipt = () => {
    onConfirmReceipt(order.id);
    setShowConfirmDialog(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-orange-400" />;
      case 'confirmed':
      case 'processing':
        return <Package className="h-5 w-5 text-blue-400" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-400" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'handled':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'confirmed':
      case 'processing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'shipped':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'delivered':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'handled':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Order Status</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold border flex items-center gap-2 ${getStatusColor(order.status)}`}>
          {getStatusIcon(order.status)}
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      {/* Order Timeline */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-4 ${
            ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'handled'].includes(order.status)
              ? 'bg-green-400' : 'bg-gray-400'
          }`}></div>
          <div>
            <p className="text-white font-medium">Order Placed</p>
            <p className="text-gray-400 text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-4 ${
            ['confirmed', 'processing', 'shipped', 'delivered', 'handled'].includes(order.status)
              ? 'bg-green-400' : 'bg-gray-400'
          }`}></div>
          <div>
            <p className="text-white font-medium">Order Confirmed</p>
            <p className="text-gray-400 text-sm">Producer has confirmed your order</p>
          </div>
        </div>

        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-4 ${
            ['processing', 'shipped', 'delivered', 'handled'].includes(order.status)
              ? 'bg-green-400' : 'bg-gray-400'
          }`}></div>
          <div>
            <p className="text-white font-medium">Processing</p>
            <p className="text-gray-400 text-sm">Your order is being prepared</p>
          </div>
        </div>

        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-4 ${
            ['shipped', 'delivered', 'handled'].includes(order.status)
              ? 'bg-green-400' : 'bg-gray-400'
          }`}></div>
          <div>
            <p className="text-white font-medium">Shipped</p>
            <p className="text-gray-400 text-sm">
              {order.trackingNumber ? `Tracking: ${order.trackingNumber}` : 'Order is on its way'}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-4 ${
            ['delivered', 'handled'].includes(order.status)
              ? 'bg-green-400' : 'bg-gray-400'
          }`}></div>
          <div>
            <p className="text-white font-medium">Delivered</p>
            <p className="text-gray-400 text-sm">Order has been delivered</p>
          </div>
        </div>

        {order.isConfirmedByCustomer && (
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-4 bg-emerald-400"></div>
            <div>
              <p className="text-white font-medium">Confirmed by Customer</p>
              <p className="text-gray-400 text-sm">
                Confirmed on {new Date(order.customerConfirmationDate!).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Button */}
      {canConfirmReceipt && (
        <div className="border-t border-white/10 pt-6">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-green-300 font-medium mb-1">Order Delivered!</h4>
                <p className="text-green-200 text-sm">
                  Please confirm that you have received your order in good condition.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowConfirmDialog(true)}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Confirm Receipt'}
          </button>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/20 p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Confirm Order Receipt</h3>
            
            <p className="text-gray-300 mb-6">
              By confirming, you acknowledge that you have received your order and are satisfied with it.
            </p>

            {/* Rating */}
            <div className="mb-4">
              <label className="block text-white text-sm font-medium mb-2">
                Rate your experience (optional)
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-2xl transition-colors"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div className="mb-6">
              <label className="block text-white text-sm font-medium mb-2">
                Feedback (optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience with this order..."
                rows={3}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReceipt}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all duration-300"
              >
                Confirm Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
