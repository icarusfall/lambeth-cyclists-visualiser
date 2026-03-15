"use client";

import dynamic from "next/dynamic";

const WardsMap = dynamic(() => import("@/components/wards/WardsMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
        <p className="mt-4 text-gray-600">Loading wards map...</p>
      </div>
    </div>
  ),
});

export default function WardsPage() {
  return <WardsMap />;
}
