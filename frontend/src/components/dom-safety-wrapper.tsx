"use client";

import { useEffect } from 'react';

/**
 * DOM Safety Wrapper - Prevents React DOM removeChild errors
 * by patching DOM methods to be React-safe
 */
export function DOMSafetyWrapper() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Store original methods
    const originalRemoveChild = Node.prototype.removeChild;
    const originalAppendChild = Node.prototype.appendChild;
    const originalInsertBefore = Node.prototype.insertBefore;
    const originalRemove = Element.prototype.remove;

    // Patch removeChild to be React-safe
    Node.prototype.removeChild = function<T extends Node>(child: T): T {
      try {
        if (this && child) {
          // Check if child is actually a child of this node
          if (this.contains && this.contains(child)) {
            return originalRemoveChild.call(this, child) as T;
          }
          // Check if child has this as parent
          if (child.parentNode === this) {
            return originalRemoveChild.call(this, child) as T;
          }
          // If no relationship, just return the child
          return child;
        }
        return child;
      } catch (error) {
        console.warn('DOM removeChild error prevented:', error);
        return child;
      }
    };

    // Patch appendChild to be React-safe
    Node.prototype.appendChild = function<T extends Node>(child: T): T {
      try {
        if (this && child) {
          return originalAppendChild.call(this, child) as T;
        }
        return child;
      } catch (error) {
        console.warn('DOM appendChild error prevented:', error);
        return child;
      }
    };

    // Patch insertBefore to be React-safe
    Node.prototype.insertBefore = function<T extends Node>(newNode: T, referenceNode: Node | null): T {
      try {
        if (this && newNode) {
          return originalInsertBefore.call(this, newNode, referenceNode) as T;
        }
        return newNode;
      } catch (error) {
        console.warn('DOM insertBefore error prevented:', error);
        return newNode;
      }
    };

    // Patch Element.remove to be React-safe
    Element.prototype.remove = function() {
      try {
        if (this.parentNode) {
          return originalRemove.call(this);
        }
      } catch (error) {
        console.warn('DOM remove error prevented:', error);
      }
    };

    // Cleanup function to restore original methods
    return () => {
      Node.prototype.removeChild = originalRemoveChild;
      Node.prototype.appendChild = originalAppendChild;
      Node.prototype.insertBefore = originalInsertBefore;
      Element.prototype.remove = originalRemove;
    };
  }, []);

  return null;
}
