export default function Loading() {
  return (
    <div className="min-h-screen bg-black p-8 flex flex-col items-center">
      {/* Header Skeleton */}
      <div className="w-full max-w-5xl mb-12 flex justify-between items-center border-b border-gray-800 pb-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-800 rounded animate-pulse"></div>
          <div className="h-4 w-32 bg-gray-900 rounded animate-pulse"></div>
        </div>
        <div className="h-4 w-20 bg-gray-900 rounded animate-pulse"></div>
      </div>

      {/* Date Picker Skeleton */}
      <div className="w-full max-w-5xl mb-8">
        <div className="h-14 w-full md:w-48 bg-gray-800 rounded-xl animate-pulse"></div>
      </div>

      {/* Grid Skeleton */}
      <div className="w-full max-w-5xl grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="h-24 bg-gray-900/50 border border-gray-800 rounded-lg animate-pulse"
          ></div>
        ))}
      </div>
    </div>
  );
}