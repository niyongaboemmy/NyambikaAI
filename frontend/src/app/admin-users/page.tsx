"use client";

import React, { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const page = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">nagement</div>
    </ProtectedRoute>
  );
}

export default page;

function AdminUsers() {
  // Note: This function is not being used anywhere in the code. It's likely a mistake and should be removed or used accordingly.
}
