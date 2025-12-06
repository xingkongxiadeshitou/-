import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Download, 
  Type, 
  Trash2, 
  Settings2, 
  Grid3X3, 
  Palette,
  Layout,
  MousePointer2,
  Image as ImageIcon,
  Languages
} from 'lucide-react';
import { Button } from './components/Button';
import { Slider } from './components/Slider';
import { WatermarkSettings, Language } from './types';

// --- Translation Configuration ---
const TRANSLATIONS = {
  zh: {
    title: '水印大师',
    clear: '清除图片',
    export: '导出图片',
    content: '内容设置',
    watermarkText: '水印文字',
    placeholder: '在此输入水印...',
    appearance: '外观样式',
    color: '文字颜色',
    opacity: '不透明度',
    size: '字体大小',
    shadow: '阴影强度',
    layout: '布局与位置',
    tilePattern: '全图平铺模式',
    rotation: '旋转角度',
    posX: '水平位置',
    posY: '垂直位置',
    dragTip: '提示: 你也可以直接在图片上拖动文字调整位置。',
    uploadTitle: '上传图片',
    uploadDesc: '点击或拖拽图片到此处',
    uploadSub: '支持 JPG, PNG, WEBP 格式 (最大 20MB)',
    selectFile: '选择图片文件',
    unitDegree: '度'
  },
  en: {
    title: 'MarkMaster',
    clear: 'Clear',
    export: 'Export Image',
    content: 'Content',
    watermarkText: 'Watermark Text',
    placeholder: 'Enter watermark text...',
    appearance: 'Appearance',
    color: 'Color',
    opacity: 'Opacity',
    size: 'Size',
    shadow: 'Shadow',
    layout: 'Layout & Position',
    tilePattern: 'Tile Pattern',
    rotation: 'Rotation',
    posX: 'Position X',
    posY: 'Position Y',
    dragTip: 'Tip: You can also drag the text on the preview.',
    uploadTitle: 'Upload an Image',
    uploadDesc: 'Drag and drop or click to browse',
    uploadSub: 'Supports JPG, PNG, WEBP up to 20MB',
    selectFile: 'Select File',
    unitDegree: '°'
  }
};

const INITIAL_SETTINGS: WatermarkSettings = {
  text: '仅供内部使用', // Default to Chinese text
  fontSize: 150,
  opacity: 0.5,
  rotation: -30,
  color: '#ffffff',
  x: 50,
  y: 50,
  shadowBlur: 10,
  shadowColor: 'rgba(0,0,0,0.5)',
  isTiled: false,
};

const PRESET_COLORS = [
  '#ffffff', '#000000', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'
];

export default function App() {
  const [lang, setLang] = useState<Language>('zh');
  const t = TRANSLATIONS[lang];

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [settings, setSettings] = useState<WatermarkSettings>(INITIAL_SETTINGS);
  const [isDragging, setIsDragging] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update default text when switching languages if user hasn't typed custom text yet
  useEffect(() => {
    setSettings(prev => {
      // Only reset if it matches one of the defaults
      if (prev.text === '仅供内部使用' && lang === 'en') return { ...prev, text: 'CONFIDENTIAL' };
      if (prev.text === 'CONFIDENTIAL' && lang === 'zh') return { ...prev, text: '仅供内部使用' };
      return prev;
    });
  }, [lang]);

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setImageName(file.name.replace(/\.[^/.]+$/, ""));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Draw Function
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match original image
    canvas.width = image.width;
    canvas.height = image.height;

    // 1. Draw Original Image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    // 2. Configure Text Styles
    ctx.save();
    ctx.globalAlpha = settings.opacity;
    ctx.fillStyle = settings.color;
    
    // Scale font size based on image width reference (1000px)
    const scaleFactor = Math.max(image.width, image.height) / 1000;
    const computedFontSize = settings.fontSize * scaleFactor;
    
    ctx.font = `bold ${computedFontSize}px Inter, sans-serif`;
    ctx.shadowColor = settings.shadowColor;
    ctx.shadowBlur = settings.shadowBlur * scaleFactor;
    ctx.shadowOffsetX = 2 * scaleFactor;
    ctx.shadowOffsetY = 2 * scaleFactor;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const textMetrics = ctx.measureText(settings.text);
    const textWidth = textMetrics.width;

    if (settings.isTiled) {
      // TILED MODE
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.translate(cx, cy);
      ctx.rotate((settings.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);

      const diag = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);
      const gridSize = diag * 1.5;
      
      const spacingX = textWidth + (computedFontSize * 2);
      const spacingY = computedFontSize * 4;

      const startX = cx - gridSize / 2;
      const startY = cy - gridSize / 2;

      for (let y = startY; y < startY + gridSize; y += spacingY) {
        for (let x = startX; x < startX + gridSize; x += spacingX) {
           const rowOffset = (Math.floor((y - startY) / spacingY) % 2 === 0) ? 0 : spacingX / 2;
           ctx.fillText(settings.text, x + rowOffset, y);
        }
      }

    } else {
      // SINGLE MODE
      const posX = (canvas.width * settings.x) / 100;
      const posY = (canvas.height * settings.y) / 100;

      ctx.translate(posX, posY);
      ctx.rotate((settings.rotation * Math.PI) / 180);
      ctx.fillText(settings.text, 0, 0);
    }
    
    ctx.restore();
  }, [image, settings]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleDownload = () => {
    if (!canvasRef.current || !image) return;
    const link = document.createElement('a');
    link.download = `${imageName}-watermarked.png`;
    link.href = canvasRef.current.toDataURL('image/png', 1.0);
    link.click();
  };

  const updateSetting = <K extends keyof WatermarkSettings>(key: K, value: WatermarkSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Dragging Logic
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (settings.isTiled || !image) return;
    setIsDragging(true);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current || settings.isTiled) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, (y / rect.height) * 100));

    setSettings(prev => ({ ...prev, x: xPercent, y: yPercent }));
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const toggleLanguage = () => {
    setLang(prev => prev === 'zh' ? 'en' : 'zh');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-200 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Settings2 className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {t.title}
          </h1>
        </div>
        <div className="flex items-center space-x-3">
           <Button 
             variant="secondary" 
             onClick={toggleLanguage}
             className="text-xs px-3"
             icon={<Languages className="w-4 h-4" />}
           >
             {lang === 'zh' ? 'En' : '中文'}
           </Button>

           {image && (
             <Button 
                variant="outline" 
                onClick={() => setImage(null)}
                className="text-xs hidden sm:inline-flex"
                icon={<Trash2 className="w-4 h-4" />}
             >
               {t.clear}
             </Button>
           )}
           <Button 
             variant="primary"
             onClick={handleDownload}
             disabled={!image}
             icon={<Download className="w-4 h-4" />}
           >
             {t.export}
           </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-80 md:w-96 flex-shrink-0 bg-slate-900 border-r border-slate-800 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* Section: Content */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center">
              <Type className="w-4 h-4 mr-2 text-indigo-400" />
              {t.content}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
                  {t.watermarkText}
                </label>
                <input
                  type="text"
                  value={settings.text}
                  onChange={(e) => updateSetting('text', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder={t.placeholder}
                />
              </div>
            </div>
          </div>

          {/* Section: Appearance */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center">
              <Palette className="w-4 h-4 mr-2 text-indigo-400" />
              {t.appearance}
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{t.color}</label>
                <div className="grid grid-cols-8 gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => updateSetting('color', color)}
                      className={`w-6 h-6 rounded-full border border-slate-600 transition-transform hover:scale-110 ${settings.color === color ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <div className="relative w-6 h-6 rounded-full overflow-hidden border border-slate-600">
                     <input 
                      type="color" 
                      value={settings.color}
                      onChange={(e) => updateSetting('color', e.target.value)}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
                     />
                  </div>
                </div>
              </div>

              <Slider
                label={t.opacity}
                value={settings.opacity}
                min={0}
                max={1}
                step={0.01}
                onChange={(val) => updateSetting('opacity', val)}
              />
              <Slider
                label={t.size}
                value={settings.fontSize}
                min={20}
                max={500}
                onChange={(val) => updateSetting('fontSize', val)}
              />
               <Slider
                label={t.shadow}
                value={settings.shadowBlur}
                min={0}
                max={50}
                onChange={(val) => updateSetting('shadowBlur', val)}
              />
            </div>
          </div>

          {/* Section: Layout */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center">
              <Layout className="w-4 h-4 mr-2 text-indigo-400" />
              {t.layout}
            </h2>

            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300 flex items-center">
                    <Grid3X3 className="w-4 h-4 mr-2 text-slate-400" />
                    {t.tilePattern}
                  </span>
                  <button 
                    onClick={() => updateSetting('isTiled', !settings.isTiled)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${settings.isTiled ? 'bg-indigo-600' : 'bg-slate-600'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settings.isTiled ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
               </div>
            </div>

            <Slider
              label={t.rotation}
              value={settings.rotation}
              min={-180}
              max={180}
              unit={t.unitDegree}
              onChange={(val) => updateSetting('rotation', val)}
            />

            {!settings.isTiled && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <Slider
                  label={t.posX}
                  value={settings.x}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(val) => updateSetting('x', val)}
                />
                <Slider
                  label={t.posY}
                  value={settings.y}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(val) => updateSetting('y', val)}
                />
                <div className="text-xs text-slate-500 flex items-center bg-slate-800/30 p-2 rounded">
                  <MousePointer2 className="w-3 h-3 mr-2" />
                  {t.dragTip}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Canvas Workspace */}
        <section className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center p-8">
          {/* Background Grid Pattern for Transparency */}
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
               style={{ 
                 backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', 
                 backgroundSize: '24px 24px' 
               }}>
          </div>

          {!image ? (
            <div className="relative z-10 text-center space-y-6 max-w-md mx-auto p-10 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-900/30 hover:bg-slate-900/50 hover:border-indigo-500/50 transition-all duration-300 group">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                <ImageIcon className="w-10 h-10 text-indigo-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">{t.uploadTitle}</h3>
                <p className="text-slate-400">{t.uploadDesc}</p>
                <p className="text-xs text-slate-500">{t.uploadSub}</p>
              </div>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                {t.selectFile}
              </Button>
            </div>
          ) : (
             <div className="relative z-10 max-w-full max-h-full shadow-2xl shadow-black/50 rounded-sm overflow-hidden ring-1 ring-slate-800">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  className={`max-w-full max-h-[85vh] object-contain cursor-${settings.isTiled ? 'default' : isDragging ? 'grabbing' : 'grab'}`}
                  style={{ touchAction: 'none' }}
                />
             </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </section>
      </main>
    </div>
  );
}
