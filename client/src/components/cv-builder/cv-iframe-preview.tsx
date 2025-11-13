import React, { useEffect, useRef, useState, useCallback } from "react";
import { useCVData } from "@/hooks/use-cv-data";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function CVIframePreview() {
  const { cvData, templateId, templateType, mainColor } = useCVData();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(2); // Default to 2 pages for demo
  const [scale, setScale] = useState(0.8);
  const [error, setError] = useState<string | null>(null);

  // Function to create a secure iframe with protected content
  const updateIframeContent = useCallback(async () => {
    if (!iframeRef.current || !cvData) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Skip the apiRequest helper and use fetch directly for more control
      // Add a cache-busting parameter to ensure fresh content
      const cacheBuster = `nocache=${Date.now()}`;
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';
      const response = await fetch(`${base}/api/cv-preview?${cacheBuster}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        body: JSON.stringify({
          cvData,
          templateType,
          templateId,
          mainColor,
          currentPage
        }),
        credentials: 'include'
      });
      
      // Check response status
      if (!response.ok) {
        let errorText = await response.text();
        try {
          // Try to get more detailed error if available
          const errorJson = JSON.parse(errorText);
          errorText = errorJson.message || errorText;
        } catch (e) {
          // If it's not valid JSON, use the text as is
        }
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
      
      const htmlContent = await response.text();
      
      // Create a blob URL from the HTML response
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Set the iframe src to the blob URL
      iframeRef.current.src = blobUrl;
      
      // Add load event listener to iframe to know when it's ready
      iframeRef.current.onload = () => {
        setLoading(false);
        // Revoke the blob URL to free memory
        URL.revokeObjectURL(blobUrl);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la génération de l\'aperçu du CV');
      setLoading(false);
    }
  }, [cvData, templateId, templateType, mainColor, currentPage]);
  
  // Update the iframe when CV data changes
  useEffect(() => {
    updateIframeContent();
  }, [updateIframeContent]);
  
  // Setup message listener for page navigation communications with the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'totalPages') {
        setTotalPages(event.data.count);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  // Update scale when container size changes
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      
      // Calculate proper scale to fit the A4 page in the container while preserving aspect ratio
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      // A4 ratio is 1:1.414 (width:height)
      const a4Width = 595; // A4 width in pixels at 72dpi
      const a4Height = 842; // A4 height in pixels at 72dpi
      
      const widthScale = containerWidth / a4Width;
      const heightScale = containerHeight / a4Height;
      
      // Use the smaller scale to ensure the entire page fits
      const newScale = Math.min(widthScale, heightScale) * 0.95; // 0.95 to add some margin
      
      setScale(newScale);
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    
    return () => window.removeEventListener('resize', updateScale);
  }, []);
  
  // Function to navigate between pages
  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    setCurrentPage(newPage);
    
    // Send message to iframe to change page
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'changePage',
        page: newPage
      }, '*');
    }
  };
  
  return (
    <div className="h-full flex flex-col relative">
      {/* Main preview container with A4 document */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-gray-100 flex items-center justify-center p-4"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10 p-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md text-center">
              <h3 className="text-red-800 font-medium mb-2">Erreur de prévisualisation</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <button 
                onClick={updateIframeContent}
                className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-sm rounded-md transition"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}
        
        <div 
          className="relative"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center top'
          }}
        >
          <iframe
            ref={iframeRef}
            className="bg-white shadow-lg"
            style={{
              width: '595px', // A4 width in pixels at 72dpi
              height: '842px', // A4 height in pixels at 72dpi
              border: 'none'
            }}
            title="CV Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
      
      {/* Pagination controls */}
      {templateType === 'A4' && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-2 border-t">
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded text-sm disabled:opacity-50"
          >
            Précédent
          </button>
          <div className="text-sm">
            Page {currentPage} / {totalPages}
          </div>
          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded text-sm disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}