'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { 
  ZoomIn, ZoomOut, RotateCcw, Download, Grid, ArrowLeft, 
  Plus, Lightbulb, Code2, FileCode, Square, Circle, Diamond, 
  Hexagon, X, MessageSquare, Terminal, Image, Wand2, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { NodeEditor } from './NodeEditor';
import { SideSummary } from './SideSummary';
import { themeColors } from '@/utils/theme';
import { ChatWidget } from './ChatWidget';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center gap-1.5">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
    </div>
  );
};


const nodeTypes = [
  { 
    id: 'rectangle', 
    name: 'Process', 
    shape: 'rect',
    icon: Square,
    example: '[Process Step]'
  },
  { 
    id: 'circle', 
    name: 'State', 
    shape: 'circle',
    icon: Circle,
    example: '((Current State))'
  },
  { 
    id: 'diamond', 
    name: 'Decision', 
    shape: 'diamond',
    icon: Diamond,
    example: '{Decision Point?}'
  },
  { 
    id: 'hexagon', 
    name: 'Preparation', 
    shape: 'hexagon',
    icon: Hexagon,
    example: '{{Prepare Data}}'
  }
];

function ExportMenu({ onExport, onClose }) {
  const exportOptions = [
    { format: 'svg', label: 'SVG Vector' },
    { format: 'jpg', label: 'JPG Image' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-48 z-50 pointer-events-auto"
    >
      {exportOptions.map(({ format, label }) => (
        <button
          key={format}
          onClick={(e) => {
            e.stopPropagation();
            onExport(format);
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        >
          <Download size={16} />
          {label}
        </button>
      ))}
    </motion.div>
  );
}
function EditPromptModal({ isOpen, onClose, onSubmit }) {
  const [prompt, setPrompt] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 pointer-events-none">
      <motion.div 
        drag
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        dragConstraints={{ left: -500, right: 500, top: -300, bottom: 300 }}
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        style={{ x: position.x, y: position.y }}
        onDrag={(event, info) => {
          setPosition({
            x: position.x + info.delta.x,
            y: position.y + info.delta.y
          });
        }}
        className="absolute top-20 right-8 w-96 pointer-events-auto"
      >
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div 
            className="p-4 cursor-move bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-between"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
              }
            }}
          >
            <div className="flex items-center gap-2">
              <Wand2 className="text-blue-600" size={20} />
              <h3 className="text-sm font-medium text-gray-900">Edit Flowchart</h3>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-blue-200/50 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-24 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="Describe your changes (e.g., 'Add an error handling step after login', 'Change the decision diamond text to...', etc.)"
              onClick={(e) => {
                if (isDragging) {
                  e.preventDefault();
                }
              }}
              autoFocus
            />

            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (prompt.trim()) {
                    onSubmit(prompt);
                    setPrompt('');
                  }
                }}
                disabled={!prompt.trim()}
                className="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Wand2 size={14} />
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
function Toolbar({
  onZoom,
  onReset,
  onExport,
  onBack,
  scale,
  showGrid,
  onToggleGrid,
  onExplain,
  onViewMermaid,
  onViewPseudocode,
  showSummary,
  showMermaidSyntax,
  showPseudocode,
  summaryLoading,
  syntaxLoading,
  pseudocodeLoading,
  onToggleChat,
  onEditPrompt
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-gray-600">
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="w-px h-6 bg-gray-200 mx-2" />

        <button onClick={() => onZoom(-0.1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600" title="Zoom Out">
          <ZoomOut size={20} />
        </button>

        <button onClick={() => onZoom(0.1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600" title="Zoom In">
          <ZoomIn size={20} />
        </button>

        <span className="text-sm text-gray-500 min-w-[60px]">
          {Math.round(scale * 100)}%
        </span>

        <button onClick={onReset} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600" title="Reset View">
          <RotateCcw size={20} />
        </button>

        <button onClick={onToggleGrid} className={`p-2 rounded-lg transition-colors ${showGrid ? 'bg-gray-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`} title="Toggle Grid">
          <Grid size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2">
      <button onClick={onViewMermaid} disabled={syntaxLoading} className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${showMermaidSyntax ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}>
    <Code2 size={20} />
    <span>Mermaid</span>
    {syntaxLoading && <LoadingSpinner />}
  </button>

  <button onClick={onViewPseudocode} disabled={pseudocodeLoading} className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${showPseudocode ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}>
    <Terminal size={20} />
    <span>Pseudocode</span>
    {pseudocodeLoading && <LoadingSpinner />}
  </button>

  <button onClick={onExplain} disabled={summaryLoading} className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${showSummary ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}>
    <Lightbulb size={20} />
    <span>Summary</span>
    {summaryLoading && <LoadingSpinner />}
  </button>


        <div className="w-px h-6 bg-gray-200 mx-2" />

        <button onClick={onEditPrompt} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium">
          <Wand2 size={18} />
          Edit via Prompt
        </button>

        <button onClick={onToggleChat} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium text-gray-600" title="Ideas & Suggestions">
          <MessageSquare size={20} />
          <span>Chat</span>
        </button>

        <div className="relative z-50">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowExportMenu(!showExportMenu)
            }} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium text-gray-600"
          >
            <Download size={20} />
            <span>Export</span>
          </button>

          <AnimatePresence>
            {showExportMenu && (
              <ExportMenu onExport={onExport} onClose={() => setShowExportMenu(false)} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
export function FlowchartViewer({ code, config, onBack, onChange }) {
  const containerRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showMermaidSyntax, setShowMermaidSyntax] = useState(false);
  const [showPseudocode, setShowPseudocode] = useState(false);
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState([]);
  const [mermaidSyntax, setMermaidSyntax] = useState('');
  const [pseudocode, setPseudocode] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [syntaxLoading, setSyntaxLoading] = useState(false);
  const [pseudocodeLoading, setPseudocodeLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showEditPrompt, setShowEditPrompt] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showExportMenu]);

  const handleEditPrompt = async (prompt) => {
    try {
      const requestBody = { 
        prompt,
        config,
        type: 'edit',
        currentFlowchart: code
      };
      
      console.log('Edit request:', requestBody);

      const response = await fetch('/api/generate-flowchart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to edit flowchart');
      }

      if (data.mermaidCode) {
        onChange(data.mermaidCode);
        setLastUpdate(Date.now());
        localStorage.setItem('lastFlowchartPrompt', prompt);
        toast.success('Flowchart updated successfully!');
        setShowEditPrompt(false);
      } else {
        throw new Error('No valid flowchart code received');
      }
    } catch (error) {
      console.error('Failed to edit flowchart:', error);
      toast.error(error.message || 'Failed to edit flowchart');
    }
  };
  useEffect(() => {
    const savedPrompt = localStorage.getItem('lastFlowchartPrompt');
    if (savedPrompt) {
      setCurrentPrompt(savedPrompt);
    }
  }, []);

  const generateSummary = async () => {
    if (!code) return;
    setSummaryLoading(true);
    try {
      const response = await fetch('/api/generate-flowchart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: code, type: 'summary', currentFlowchart: code })
      });
      if (!response.ok) throw new Error('Failed to generate explanation');
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setSummary(data.summary);
      setKeyPoints(data.keyPoints);
      setShowSummary(true);
      setShowMermaidSyntax(false);
      setShowPseudocode(false);
    } catch (error) {
      console.error('Summary error:', error);
      toast.error('Failed to generate explanation');
    } finally {
      setSummaryLoading(false);
    }
  };

  const generateMermaidSyntax = async () => {
    if (!code) return;
    setSyntaxLoading(true);
    try {
      const response = await fetch('/api/generate-flowchart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: code, type: 'mermaid', currentFlowchart: code })
      });
      if (!response.ok) throw new Error('Failed to get Mermaid syntax');
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setMermaidSyntax(data.mermaidCode);
      setShowMermaidSyntax(true);
      setShowSummary(false);
      setShowPseudocode(false);
    } catch (error) {
      console.error('Syntax error:', error);
      toast.error('Failed to get Mermaid syntax');
    } finally {
      setSyntaxLoading(false);
    }
  };

  const generatePseudocode = async () => {
    if (!code) return;
    setPseudocodeLoading(true);
    try {
      const response = await fetch('/api/generate-flowchart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: code, type: 'pseudocode', currentFlowchart: code })
      });
      if (!response.ok) throw new Error('Failed to generate pseudocode');
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setPseudocode(data.pseudocode);
      setShowPseudocode(true);
      setShowSummary(false);
      setShowMermaidSyntax(false);
    } catch (error) {
      console.error('Pseudocode error:', error);
      toast.error('Failed to generate pseudocode');
    } finally {
      setPseudocodeLoading(false);
    }
  };

  const handleExport = async (format = 'svg') => {
    try {
      const svgElement = containerRef.current?.querySelector('.flowchart-wrapper svg');
      if (!svgElement) {
        toast.error('No flowchart to export');
        return;
      }

      const svgClone = svgElement.cloneNode(true);
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      // Get dimensions
      const bbox = svgElement.getBoundingClientRect();
      const width = Math.round(bbox.width);
      const height = Math.round(bbox.height);
      svgClone.setAttribute('width', width);
      svgClone.setAttribute('height', height);

      // SVG Export
      if (format === 'svg') {
        const svgData = new XMLSerializer().serializeToString(svgClone);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'flowchart.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Flowchart exported as SVG');
        return;
      }

      // JPG Export
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;

      // Fill white background for JPG
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Convert SVG to Data URL
      const svgData = new XMLSerializer().serializeToString(svgClone);
      const svgBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      
      // Create temp image to draw on canvas
      const tempImg = document.createElement('img');
      tempImg.onload = () => {
        ctx.drawImage(tempImg, 0, 0);
        // Convert to JPG
        const jpgUrl = canvas.toDataURL('image/jpeg', 1.0);
        const link = document.createElement('a');
        link.href = jpgUrl;
        link.download = 'flowchart.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Flowchart exported as JPG');
      };
      tempImg.src = svgBase64;

    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleMouseDown = (e) => {
    if (e.target.closest('.node') || e.target.closest('.toolbar')) return;
    if (e.button === 0) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      requestAnimationFrame(() => {
        setPosition({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.002;
      const newScale = Math.min(Math.max(0.3, scale + delta), 3);
      setScale(newScale);
    }
  };

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, position, startPan, scale]);

  useEffect(() => {
    if (!code) return;

    const initializeMermaid = async () => {
      try {
        const cleanCode = code.replace(/```mermaid\n?/g, '').replace(/```/g, '').trim();
        const colors = themeColors[config.theme] || themeColors.default;

        mermaid.initialize({
          startOnLoad: true,
          theme: 'base',
          flowchart: { curve: 'natural', padding: 20, useMaxWidth: true, htmlLabels: true },
          themeVariables: {
            primaryColor: colors.nodeBackground,
            primaryBorderColor: colors.nodeBorder,
            primaryTextColor: colors.text,
            lineColor: colors.lineColor,
            fontFamily: config.font || 'inter'
          },
          securityLevel: 'loose'
        });

        const wrapper = containerRef.current?.querySelector('.flowchart-wrapper');
        if (!wrapper) return;

        wrapper.innerHTML = '';
        const { svg } = await mermaid.render(`flowchart-${Date.now()}`, cleanCode);
        wrapper.innerHTML = svg;

        const svgElement = wrapper.querySelector('svg');
        if (svgElement) {
          svgElement.style.width = '100%';
          svgElement.style.height = '100%';
        }
      } catch (error) {
        console.error('Mermaid error:', error);
        toast.error('Failed to render flowchart');
      }
    };

    initializeMermaid();
  }, [code, config, lastUpdate]);
  return (
    <div className="relative">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto p-4 space-y-4">
        <Toolbar
          onZoom={(delta) => setScale(prev => Math.min(Math.max(0.3, prev + delta), 3))}
          onReset={() => {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }}
          onExport={handleExport}
          onBack={onBack}
          scale={scale}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          onExplain={generateSummary}
          onViewMermaid={generateMermaidSyntax}
          onViewPseudocode={generatePseudocode}
          showSummary={showSummary}
          showMermaidSyntax={showMermaidSyntax}
          showPseudocode={showPseudocode}
          summaryLoading={summaryLoading}
          syntaxLoading={syntaxLoading}
          pseudocodeLoading={pseudocodeLoading}
          onToggleChat={() => setShowChat(!showChat)}
          onEditPrompt={() => setShowEditPrompt(true)}
        />

        <div className="flex gap-4">
          <motion.div 
            ref={containerRef}
            className="relative overflow-hidden bg-white rounded-lg border shadow-sm flex-grow"
            style={{ height: 'calc(100vh - 12rem)', cursor: isPanning ? 'grabbing' : 'grab' }}
            layout
          >
            {showGrid && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              />
            )}

            <div
              className="flowchart-wrapper absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: '0 0',
                transition: isPanning ? 'none' : 'transform 0.1s ease-out'
              }}
            />

            <AnimatePresence>
              {selectedNode && (
                <NodeEditor
                  node={selectedNode}
                  onUpdate={(updatedNode) => {
                    const nodeElement = containerRef.current?.querySelector(`#${selectedNode.id}`);
                    if (nodeElement) {
                      const textElement = nodeElement.querySelector('text');
                      if (textElement) {
                        textElement.textContent = updatedNode.text;
                        textElement.style.fontSize = `${updatedNode.fontSize}px`;
                      }
                    }
                    setSelectedNode(null);
                    setLastUpdate(Date.now());
                  }}
                  onClose={() => setSelectedNode(null)}
                />
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {(showSummary || showMermaidSyntax || showPseudocode) && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-96"
              >
                {showSummary && (
                  <SideSummary 
                    summary={summary}
                    keyPoints={keyPoints}
                    onClose={() => setShowSummary(false)}
                  />
                )}
                {showMermaidSyntax && (
                  <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code2 className="text-blue-600" size={24} />
                        <h3 className="text-lg font-semibold">Mermaid Syntax</h3>
                      </div>
                      <button onClick={() => setShowMermaidSyntax(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={18} />
                      </button>
                    </div>
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm font-mono">
                      {mermaidSyntax}
                    </pre>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(mermaidSyntax);
                        toast.success('Copied to clipboard!');
                      }}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      Copy to clipboard
                    </button>
                  </div>
                )}
                {showPseudocode && (
                  <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal className="text-blue-600" size={24} />
                        <h3 className="text-lg font-semibold">Pseudocode</h3>
                      </div>
                      <button onClick={() => setShowPseudocode(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={18} />
                      </button>
                    </div>
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap">
                      {pseudocode}
                    </pre>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pseudocode);
                        toast.success('Copied to clipboard!');
                      }}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      Copy to clipboard
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showEditPrompt && (
            <EditPromptModal
              isOpen={showEditPrompt}
              onClose={() => setShowEditPrompt(false)}
              onSubmit={handleEditPrompt}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showChat && (
            <ChatWidget 
              code={code}
              onClose={() => setShowChat(false)}
              onUpdateFlowchart={(changes) => {
                if (changes?.mermaidCode) {
                  onChange?.(changes.mermaidCode);
                  setLastUpdate(Date.now());
                  toast.success('Flowchart updated successfully!');
                }
              }}
            />
          )}
        </AnimatePresence>

        <style jsx global>{`
          .flowchart-wrapper svg {
            max-width: none !important;
            height: auto;
          }
          .node rect, .node circle, .node polygon {
            fill: ${themeColors[config.theme]?.nodeBackground || themeColors.default.nodeBackground};
            stroke: ${themeColors[config.theme]?.nodeBorder || themeColors.default.nodeBorder};
            stroke-width: 2px;
            transition: all 0.2s ease-in-out;
          }
          .node:hover rect, .node:hover circle, .node:hover polygon {
            filter: brightness(0.95);
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .node text {
            fill: ${themeColors[config.theme]?.text || themeColors.default.text};
            font-weight: 500;
            transition: all 0.2s ease-in-out;
            user-select: none;
          }
          .edgePath path {
            stroke: ${themeColors[config.theme]?.lineColor || themeColors.default.lineColor};
            stroke-width: 2px;
            transition: all 0.2s ease-in-out;
          }
          marker path {
            fill: ${themeColors[config.theme]?.lineColor || themeColors.default.lineColor};
          }
          .edgeLabel {
            background-color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 500;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }
        `}</style>
      </motion.div>
    </div>
  );
}