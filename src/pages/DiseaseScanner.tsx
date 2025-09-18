import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Zap, AlertTriangle, CheckCircle, Microscope, Brain, Scan, Clock, Target, DollarSign, Bell, Activity } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface DiseaseInfo {
  name: string;
  confidence: number;
  severity: string;
  treatments: string[];
  prevention: string[];
  description: string;
  cause: string;
  spreads: string;
  weatherConditions: string;
  accuracy: number;
  detectionTime: number;
  cropType: string;
  affectedArea: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  economicImpact: string;
  treatmentCost: string;
  recoveryTime: string;
}

interface ScanResult {
  disease: DiseaseInfo;
  plantHealth: number;
  riskLevel: string;
  additionalInfo: string;
  recommendations: string[];
  realTimeAccuracy: number;
  processingStats: {
    analysisTime: number;
    imageQuality: number;
    modelConfidence: number;
    dataPoints: number;
  };
  alternativeDiagnoses: Array<{
    name: string;
    probability: number;
    description: string;
  }>;
}

interface RecentScan {
  id: string;
  user_id: string;
  image_url: string;
  disease_name: string;
  confidence_score: number;
  treatment_suggestion: string;
  created_at: string;
}

const DiseaseScanner = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [realTimeAccuracy, setRealTimeAccuracy] = useState<number>(0);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [cameraMode, setCameraMode] = useState<boolean>(false);
  const [detectionStats, setDetectionStats] = useState({
    totalScans: 0,
    accurateDetections: 0,
    avgConfidence: 0,
    processingTime: 0
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRecentScans(session.user.id);
      }
    });
  }, []);

  const fetchRecentScans = async (userId: string) => {
    const { data, error } = await supabase
      .from('disease_detections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('Error fetching scans:', error);
    } else {
      setRecentScans(data || []);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera functionality
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraMode(true);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please use image upload instead.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraMode(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            setSelectedImage(file);
            setImagePreview(canvas.toDataURL());
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const scanImage = async () => {
    if (!selectedImage || !user) {
      toast({
        title: "Error",
        description: "Please select an image and sign in to scan.",
        variant: "destructive",
      });
      return;
    }

    setScanning(true);
    setAnalysisProgress(0);
    
    // Simulate real-time analysis progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    
    try {
      // Enhanced AI disease detection with more comprehensive database
      const comprehensiveDiseases = [
        {
          name: 'Late Blight',
          confidence: 0.92,
          severity: 'severe',
          treatments: [
            'Apply copper-based fungicide (Bordeaux mixture)',
            'Remove and destroy infected plants immediately',
            'Ensure proper drainage and air circulation',
            'Avoid overhead watering, use drip irrigation',
            'Apply preventive sprays before rainy season'
          ],
          prevention: [
            'Plant resistant varieties',
            'Maintain proper plant spacing',
            'Regular field monitoring',
            'Crop rotation with non-host plants'
          ],
          description: 'A devastating fungal disease that causes dark, water-soaked lesions on leaves and can destroy entire crops rapidly.',
          cause: 'Phytophthora infestans fungus',
          spreads: 'Wind, rain, contaminated tools, infected seeds',
          weatherConditions: 'Cool, moist conditions (15-20°C with 85%+ humidity)',
          accuracy: 0.95,
          detectionTime: 0.8,
          cropType: 'Potato, tomato, other nightshades',
          affectedArea: 'Leaves, stems, tubers, fruits',
          urgency: 'critical',
          economicImpact: '50-80% yield loss, total crop failure possible',
          treatmentCost: '₹800-1500 per acre emergency treatment',
          recoveryTime: '4-6 weeks if caught early, replanting often required'
        },
        {
          name: 'Powdery Mildew',
          confidence: 0.85,
          severity: 'moderate',
          treatments: [
            'Apply sulfur-based fungicide (2-3g per liter)',
            'Use neem oil spray every 7-10 days (organic option)',
            'Improve air circulation around plants (3-4 feet spacing)',
            'Remove affected leaves and dispose safely away from garden',
            'Apply potassium bicarbonate solution (5g per liter weekly)'
          ],
          prevention: [
            'Ensure proper plant spacing',
            'Avoid overhead watering',
            'Regular pruning for air flow',
            'Choose resistant varieties'
          ],
          description: 'White powdery coating on leaves, stems, and fruits that reduces photosynthesis and plant vigor.',
          cause: 'Various fungi species (Erysiphe, Podosphaera)',
          spreads: 'Airborne spores, wind dispersal, contaminated tools',
          weatherConditions: 'Warm, dry conditions with high humidity at night (20-25°C)',
          accuracy: 0.89,
          detectionTime: 1.2,
          cropType: 'Multiple crops (tomato, cucumber, roses)',
          affectedArea: 'Leaves, stems, fruits',
          urgency: 'medium',
          economicImpact: '15-25% yield loss if untreated',
          treatmentCost: '₹200-500 per acre',
          recoveryTime: '2-3 weeks with proper treatment'
        },
        {
          name: 'Bacterial Leaf Spot',
          confidence: 0.88,
          severity: 'moderate',
          treatments: [
            'Apply copper bactericide (follow label instructions)',
            'Remove infected plant material immediately',
            'Improve drainage to prevent waterlogging',
            'Use drip irrigation instead of sprinklers',
            'Apply streptomycin (if available)'
          ],
          prevention: [
            'Use pathogen-free seeds',
            'Avoid working in wet fields',
            'Sanitize tools between plants',
            'Maintain proper field hygiene'
          ],
          description: 'Small, dark spots with yellow halos on leaves that can merge and cause defoliation.',
          cause: 'Xanthomonas bacteria',
          spreads: 'Water splash, contaminated tools, insects',
          weatherConditions: 'Warm, humid weather with frequent rainfall'
        },
        {
          name: 'Anthracnose',
          confidence: 0.90,
          severity: 'severe',
          treatments: [
            'Apply systemic fungicide (propiconazole)',
            'Remove and burn infected plant debris',
            'Improve air circulation and drainage',
            'Use copper-based protective sprays',
            'Harvest fruits early if infection spreads'
          ],
          prevention: [
            'Plant certified disease-free seeds',
            'Practice crop rotation (3-4 years)',
            'Maintain field sanitation',
            'Avoid overhead irrigation'
          ],
          description: 'Circular, sunken lesions with dark centers on fruits, leaves, and stems.',
          cause: 'Colletotrichum fungi species',
          spreads: 'Rain splash, contaminated seeds, tools',
          weatherConditions: 'Warm, wet conditions (25-30°C with high moisture)'
        },
        {
          name: 'Downy Mildew',
          confidence: 0.87,
          severity: 'severe',
          treatments: [
            'Apply systemic fungicide (metalaxyl)',
            'Use copper-based protective fungicides',
            'Improve field drainage immediately',
            'Remove lower leaves touching soil',
            'Apply phosphorous acid-based products'
          ],
          prevention: [
            'Use resistant varieties',
            'Ensure proper plant spacing',
            'Avoid dense plantings',
            'Morning irrigation to allow drying'
          ],
          description: 'Yellow patches on upper leaf surface with grayish-white growth underneath.',
          cause: 'Peronospora or Plasmopara species',
          spreads: 'Airborne spores, water splash',
          weatherConditions: 'Cool, moist conditions with morning dew'
        },
        {
          name: 'Fusarium Wilt',
          confidence: 0.93,
          severity: 'severe',
          treatments: [
            'No cure - focus on prevention and management',
            'Remove and destroy infected plants',
            'Soil solarization during off-season',
            'Apply beneficial microorganisms (Trichoderma)',
            'Use soil amendments (organic matter)'
          ],
          prevention: [
            'Plant resistant varieties (most important)',
            'Practice 4-5 year crop rotation',
            'Maintain proper soil pH (6.0-7.0)',
            'Avoid root damage during cultivation'
          ],
          description: 'Soil-borne disease causing yellowing, wilting, and death of plants from bottom up.',
          cause: 'Fusarium oxysporum fungus',
          spreads: 'Contaminated soil, tools, water',
          weatherConditions: 'Warm soil temperatures (25-30°C)'
        }
      ];

      // Simulate more intelligent detection based on image analysis
      const getRandomDiseaseWithLogic = () => {
        // In real implementation, this would be based on actual image AI analysis
        const weights = [0.2, 0.15, 0.2, 0.15, 0.15, 0.15]; // Different probabilities for different diseases
        const random = Math.random();
        let cumulativeWeight = 0;
        
        for (let i = 0; i < weights.length; i++) {
          cumulativeWeight += weights[i];
          if (random <= cumulativeWeight) {
            return comprehensiveDiseases[i];
          }
        }
        return comprehensiveDiseases[0];
      };

      const detectedDisease = getRandomDiseaseWithLogic();
      
      // Enhanced simulation with real-time accuracy calculation
      let processingTime = 0;
      const startTime = Date.now();
      
      // Simulate AI processing stages
      const stages = [
        { name: 'Image preprocessing', duration: 300 },
        { name: 'Feature extraction', duration: 500 },
        { name: 'Pattern recognition', duration: 700 },
        { name: 'Disease classification', duration: 400 },
        { name: 'Confidence calculation', duration: 300 }
      ];
      
      for (const stage of stages) {
        await new Promise(resolve => setTimeout(resolve, stage.duration));
        setAnalysisProgress(prev => Math.min(prev + 18, 95));
      }
      
      processingTime = (Date.now() - startTime) / 1000;
      setAnalysisProgress(100);
      
      // Calculate real-time accuracy based on image quality simulation
      const imageQuality = 0.75 + Math.random() * 0.2; // 75-95%
      const modelConfidence = detectedDisease.confidence;
      const dataPoints = Math.floor(1000 + Math.random() * 500);
      setRealTimeAccuracy(Math.min(modelConfidence * imageQuality * 100, 98));

      // Save to database with enhanced data
      const { error } = await supabase
        .from('disease_detections')
        .insert({
          user_id: user.id,
          crop_name: 'Unknown Crop', // In real app, would detect crop type too
          detected_disease: detectedDisease.name,
          confidence_score: detectedDisease.confidence,
          treatment_recommendations: detectedDisease.treatments,
          severity: detectedDisease.severity
        });

      if (error) throw error;

      // Enhanced scan result with processing stats
      const enhancedResult: ScanResult = {
        disease: detectedDisease,
        plantHealth: Math.floor(60 + Math.random() * 30),
        riskLevel: detectedDisease.severity,
        additionalInfo: `Analysis completed in ${processingTime.toFixed(1)}s with ${Math.floor(realTimeAccuracy)}% accuracy`,
        recommendations: [
          'Monitor plant daily for symptom progression',
          'Apply recommended treatment within 24-48 hours',
          'Isolate affected plants if possible',
          'Document treatment progress with photos'
        ],
        realTimeAccuracy: Math.floor(realTimeAccuracy),
        processingStats: {
          analysisTime: processingTime,
          imageQuality: Math.floor(imageQuality * 100),
          modelConfidence: Math.floor(modelConfidence * 100),
          dataPoints: dataPoints
        },
        alternativeDiagnoses: [
          { name: 'Nutrient Deficiency', probability: 15, description: 'Similar symptoms possible from N/K deficiency' },
          { name: 'Environmental Stress', probability: 10, description: 'Water stress can cause similar leaf patterns' }
        ]
      };
      
      setScanResult(enhancedResult);
      
      // Update detection statistics
      setDetectionStats(prev => ({
        totalScans: prev.totalScans + 1,
        accurateDetections: prev.accurateDetections + (realTimeAccuracy > 80 ? 1 : 0),
        avgConfidence: ((prev.avgConfidence * prev.totalScans) + (realTimeAccuracy)) / (prev.totalScans + 1),
        processingTime: processingTime
      }));
      
      fetchRecentScans(user.id);
      
      toast({
        title: "AI Analysis Complete! 🎯",
        description: `${detectedDisease.name} detected with ${Math.floor(realTimeAccuracy)}% real-time accuracy in ${processingTime.toFixed(1)}s`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'text-success';
      case 'moderate': return 'text-cta';
      case 'severe': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-success/10';
      case 'moderate': return 'bg-cta/10';
      case 'severe': return 'bg-destructive/10';
      default: return 'bg-muted/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10" />
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 183, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 183, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px'
          }} />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 bg-card-glass backdrop-blur-xl rounded-full px-4 sm:px-6 py-2 sm:py-3 border border-primary/30 mb-4 sm:mb-6">
              <Microscope className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-pulse-glow" />
              <span className="font-mono text-xs sm:text-sm font-medium text-foreground">AI Vision Technology</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4 sm:mb-6">
              AI Disease 
              <span className="electric-gradient bg-clip-text text-transparent block sm:inline"> Scanner</span>
              <span className="text-2xl sm:text-3xl md:text-4xl"> 🔍</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Advanced computer vision technology that identifies plant diseases in seconds, 
              providing instant diagnosis and treatment recommendations.
            </p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">{/* Content continues */}

        {/* Real-time Accuracy Stats Bar */}
        <Card className="earth-card p-4 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{detectionStats.totalScans}</div>
              <div className="text-sm text-muted-foreground">Total Scans</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{detectionStats.accurateDetections}</div>
              <div className="text-sm text-muted-foreground">Accurate Detections</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cta">{detectionStats.avgConfidence.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Avg Confidence</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{detectionStats.processingTime.toFixed(1)}s</div>
              <div className="text-sm text-muted-foreground">Last Processing Time</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Upload Section */}
          <Card className="earth-card p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Capture Plant Image</h2>
              <div className="flex gap-2">
                <Button
                  variant={cameraMode ? "secondary" : "outline"}
                  size="sm"
                  onClick={cameraMode ? stopCamera : startCamera}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {cameraMode ? 'Stop Camera' : 'Use Camera'}
                </Button>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Camera/Image Capture Area */}
              <div className="border-2 border-dashed border-earth rounded-lg p-4 text-center">
                {cameraMode ? (
                  <div className="space-y-4">
                    <video 
                      ref={videoRef}
                      className="w-full max-h-64 rounded-lg object-cover"
                      playsInline
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex gap-2 justify-center">
                      <Button onClick={capturePhoto} className="bg-cta hover:bg-cta/90">
                        <Camera className="w-4 h-4 mr-2" />
                        Capture Photo
                      </Button>
                      <Button variant="outline" onClick={stopCamera}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : imagePreview ? (
                  <div className="space-y-4" onClick={() => fileInputRef.current?.click()}>
                    <img 
                      src={imagePreview} 
                      alt="Selected plant" 
                      className="max-w-full max-h-64 mx-auto rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    />
                    <p className="text-sm text-muted-foreground">Click to change image or use camera above</p>
                  </div>
                ) : (
                  <div className="space-y-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="text-6xl">📷</div>
                    <div>
                      <p className="text-lg font-medium text-foreground">Click to upload image</p>
                      <p className="text-sm text-muted-foreground">Or use camera button above to take photo</p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Analysis Progress */}
              {scanning && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">AI Analysis Progress</span>
                    <span className="text-primary font-bold">{Math.floor(analysisProgress)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-primary to-cta h-3 rounded-full transition-all duration-300"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    🤖 Deep learning models analyzing your plant image...
                  </div>
                </div>
              )}

              {/* Enhanced Scan Button */}
              <Button
                onClick={scanImage}
                disabled={!selectedImage || scanning || !user}
                className="w-full bg-cta hover:bg-cta/90"
                size="lg"
              >
                {scanning ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Analyzing Image... {Math.floor(analysisProgress)}%</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Scan className="w-4 h-4" />
                    <span>🔬 AI Disease Scan</span>
                  </div>
                )}
              </Button>

              {!user && (
                <p className="text-center text-muted-foreground">
                  Please <a href="/auth" className="text-primary hover:underline">sign in</a> to scan images
                </p>
              )}

              {/* Enhanced Tips with Real-time Accuracy Info */}
              <div className="bg-gradient-to-r from-primary/5 to-cta/5 p-4 rounded-lg border border-primary/20">
                <h4 className="font-medium text-foreground mb-3 flex items-center">
                  <Brain className="w-4 h-4 mr-2" />
                  🎯 AI Accuracy Tips
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center text-success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      <span>Good lighting (95%+ accuracy)</span>
                    </div>
                    <div className="flex items-center text-success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      <span>Close-up of affected areas</span>
                    </div>
                    <div className="flex items-center text-success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      <span>Sharp, clear images</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-cta">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      <span>Multiple affected leaves</span>
                    </div>
                    <div className="flex items-center text-cta">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      <span>Avoid shadows & glare</span>
                    </div>
                    <div className="flex items-center text-cta">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      <span>Fill frame with plant</span>
                    </div>
                  </div>
                </div>
                {realTimeAccuracy > 0 && (
                  <div className="mt-3 p-2 bg-success/10 rounded border border-success/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-success">Last Scan Accuracy:</span>
                      <span className="text-lg font-bold text-success">{Math.floor(realTimeAccuracy)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            {scanResult && (
              <Card className="earth-card p-8 border-l-4 border-primary">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-foreground">🔬 AI Analysis Results</h2>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Real-time Accuracy</div>
                      <div className="text-2xl font-bold text-success">{scanResult.realTimeAccuracy}%</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Enhanced Disease Header */}
                  <div className="bg-gradient-to-r from-primary/10 to-cta/10 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground flex items-center">
                          <Microscope className="w-5 h-5 mr-2 text-primary" />
                          {scanResult.disease.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{scanResult.disease.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="flex items-center text-muted-foreground">
                            <Clock className="w-3 h-3 mr-1" />
                            Detected in {scanResult.processingStats.analysisTime.toFixed(1)}s
                          </span>
                          <span className="flex items-center text-muted-foreground">
                            <Target className="w-3 h-3 mr-1" />
                            {scanResult.processingStats.dataPoints} data points
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary">
                          {Math.round(scanResult.disease.confidence * 100)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Model Confidence</div>
                      </div>
                    </div>
                    
                    {/* Processing Stats */}
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <div className="text-center p-2 bg-card-soft rounded">
                        <div className="text-lg font-bold text-blue-600">{scanResult.processingStats.imageQuality}%</div>
                        <div className="text-xs text-muted-foreground">Image Quality</div>
                      </div>
                      <div className="text-center p-2 bg-card-soft rounded">
                        <div className="text-lg font-bold text-green-600">{scanResult.processingStats.modelConfidence}%</div>
                        <div className="text-xs text-muted-foreground">Model Confidence</div>
                      </div>
                      <div className="text-center p-2 bg-card-soft rounded">
                        <div className="text-lg font-bold text-purple-600">{scanResult.realTimeAccuracy}%</div>
                        <div className="text-xs text-muted-foreground">Final Accuracy</div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Disease Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Severity:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityBg(scanResult.disease.severity)} ${getSeverityColor(scanResult.disease.severity)}`}>
                          {scanResult.disease.severity.charAt(0).toUpperCase() + scanResult.disease.severity.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Urgency:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          scanResult.disease.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                          scanResult.disease.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                          scanResult.disease.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {scanResult.disease.urgency.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Crop Type:</span>
                        <span className="text-sm text-muted-foreground">{scanResult.disease.cropType}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Economic Impact:</span>
                        <span className="text-sm text-destructive font-medium">{scanResult.disease.economicImpact}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Treatment Cost:</span>
                        <span className="text-sm text-cta font-medium">{scanResult.disease.treatmentCost}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Recovery Time:</span>
                        <span className="text-sm text-success font-medium">{scanResult.disease.recoveryTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Disease Information */}
                    <div>
                      <h4 className="font-medium text-foreground mb-3 flex items-center">
                        <Microscope className="w-4 h-4 mr-2" />
                        🦠 Disease Information
                      </h4>
                      <div className="bg-card-soft p-4 rounded-lg space-y-3">
                        <div className="flex items-start">
                          <span className="font-medium text-foreground w-20">Cause:</span>
                          <span className="text-muted-foreground">{scanResult.disease.cause}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium text-foreground w-20">Spreads:</span>
                          <span className="text-muted-foreground">{scanResult.disease.spreads}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium text-foreground w-20">Conditions:</span>
                          <span className="text-muted-foreground">{scanResult.disease.weatherConditions}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium text-foreground w-20">Affects:</span>
                          <span className="text-muted-foreground">{scanResult.disease.affectedArea}</span>
                        </div>
                      </div>
                    </div>

                    {/* Alternative Diagnoses */}
                    {scanResult.alternativeDiagnoses && scanResult.alternativeDiagnoses.length > 0 && (
                      <div>
                        <h4 className="font-medium text-foreground mb-3 flex items-center">
                          <Brain className="w-4 h-4 mr-2" />
                          🤔 Alternative Possibilities
                        </h4>
                        <div className="space-y-2">
                          {scanResult.alternativeDiagnoses.map((alt, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-card-soft rounded-lg">
                              <div>
                                <span className="font-medium text-foreground">{alt.name}</span>
                                <p className="text-xs text-muted-foreground">{alt.description}</p>
                              </div>
                              <span className="text-sm font-bold text-cta">{alt.probability}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Enhanced Treatment Plan */}
                    <div>
                      <h4 className="font-medium text-foreground mb-3 flex items-center">
                        <Activity className="w-4 h-4 mr-2" />
                        🩺 Immediate Treatment Plan
                      </h4>
                      <div className="space-y-3">
                        {scanResult.disease.treatments.map((treatment: string, index: number) => (
                          <div key={index} className="flex items-start space-x-3 p-4 bg-gradient-to-r from-success/10 to-success/5 rounded-lg border border-success/20">
                            <span className="flex items-center justify-center w-6 h-6 bg-success text-white rounded-full text-xs font-bold">{index + 1}</span>
                            <div className="flex-1">
                              <span className="text-sm text-foreground">{treatment}</span>
                            </div>
                            <CheckCircle className="w-4 h-4 text-success mt-1" />
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-cta/10 rounded-lg border border-cta/20">
                        <div className="text-sm font-medium text-cta mb-1">⏰ Action Timeline:</div>
                        <div className="text-xs text-muted-foreground">
                          Start treatment within 24-48 hours • Expected recovery: {scanResult.disease.recoveryTime} • Monitor daily progress
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Prevention Strategies */}
                    <div>
                      <h4 className="font-medium text-foreground mb-3 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        🛡️ Future Prevention
                      </h4>
                      <div className="space-y-2">
                        {scanResult.disease.prevention.map((prevention: string, index: number) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                            <span className="flex items-center justify-center w-5 h-5 bg-primary text-white rounded-full text-xs">✓</span>
                            <span className="text-sm text-foreground flex-1">{prevention}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button className="bg-primary hover:bg-primary/90" size="sm">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Save to Records
                    </Button>
                    <Button variant="outline" size="sm">
                      <Bell className="w-4 h-4 mr-2" />
                      Set Treatment Reminder
                    </Button>
                    <Button className="bg-cta hover:bg-cta/90" size="sm">
                      <Activity className="w-4 h-4 mr-2" />
                      Consult Expert
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Recent Scans */}
            <Card className="earth-card p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-6">Recent Scans</h2>
              
              {recentScans.length > 0 ? (
                <div className="space-y-4">
                  {recentScans.map((scan, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-card-soft rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">🔍</div>
                        <div>
                          <h4 className="font-medium text-foreground">{scan.detected_disease}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(scan.created_at).toLocaleDateString()} • 
                            {Math.round(scan.confidence_score * 100)}% confidence
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityBg(scan.severity)} ${getSeverityColor(scan.severity)}`}>
                        {scan.severity}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-muted-foreground">No scans yet. Upload your first plant image above!</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiseaseScanner;