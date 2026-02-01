import { useState, useEffect, useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, Html } from '@react-three/drei'
import * as THREE from 'three'

// Lo-fi YouTube playlist IDs (curated selection)
const LOFI_PLAYLISTS = [
  'PLOzDu-MXXLliO9fBNZOQTBDddoA3FzZUo', // lofi hip hop
  'PLofht4PTcKYnaH8w5olJCI-wUVxuoMHqM', // chill beats
  'PL6NdkXsPL07KN01gH2vucrHCEyyNmVEx4', // study beats
  'PLQkQfzsIUwRYSpXhbaBoLJwNXMHlNEgIO', // lofi chill
]

// Simulated weather data points for the globe
const generateWeatherData = () => {
  const points: { lat: number; lng: number; temp: number; type: string }[] = []
  // Major cities with simulated weather
  const cities = [
    { lat: 40.7128, lng: -74.006, name: 'New York' },
    { lat: 51.5074, lng: -0.1278, name: 'London' },
    { lat: 35.6762, lng: 139.6503, name: 'Tokyo' },
    { lat: -33.8688, lng: 151.2093, name: 'Sydney' },
    { lat: 55.7558, lng: 37.6173, name: 'Moscow' },
    { lat: 19.4326, lng: -99.1332, name: 'Mexico City' },
    { lat: -23.5505, lng: -46.6333, name: 'São Paulo' },
    { lat: 28.6139, lng: 77.209, name: 'Delhi' },
    { lat: 31.2304, lng: 121.4737, name: 'Shanghai' },
    { lat: 1.3521, lng: 103.8198, name: 'Singapore' },
    { lat: 48.8566, lng: 2.3522, name: 'Paris' },
    { lat: 52.52, lng: 13.405, name: 'Berlin' },
    { lat: -34.6037, lng: -58.3816, name: 'Buenos Aires' },
    { lat: 37.7749, lng: -122.4194, name: 'San Francisco' },
    { lat: 25.2048, lng: 55.2708, name: 'Dubai' },
    { lat: 22.3193, lng: 114.1694, name: 'Hong Kong' },
  ]
  
  cities.forEach(city => {
    const temp = Math.floor(Math.random() * 40) - 5
    const types = ['clear', 'cloudy', 'rain', 'snow', 'storm']
    const type = types[Math.floor(Math.random() * types.length)]
    points.push({ ...city, temp, type })
  })
  
  return points
}

// Convert lat/lng to 3D position
const latLngToVector3 = (lat: number, lng: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  return new THREE.Vector3(x, y, z)
}

// Weather point component
function WeatherPoint({ lat, lng, temp, type }: { lat: number; lng: number; temp: number; type: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const position = useMemo(() => latLngToVector3(lat, lng, 2.05), [lat, lng])
  
  // Color based on temperature
  const color = useMemo(() => {
    if (temp < 0) return '#00ffff'
    if (temp < 10) return '#00aaff'
    if (temp < 20) return '#00ff88'
    if (temp < 30) return '#ffaa00'
    return '#ff4444'
  }, [temp])
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(0.8 + Math.sin(state.clock.elapsedTime * 2 + lat) * 0.2)
    }
  })
  
  const icon = type === 'rain' ? '🌧' : type === 'snow' ? '❄️' : type === 'storm' ? '⛈' : type === 'cloudy' ? '☁️' : '☀️'
  
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
      <Html distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div className="text-xs whitespace-nowrap px-2 py-1 rounded-full backdrop-blur-sm"
          style={{
            background: 'rgba(10, 10, 30, 0.8)',
            border: '1px solid rgba(0, 255, 200, 0.3)',
            color: '#fff',
            fontFamily: 'Quicksand',
            transform: 'translateX(-50%)',
          }}>
          {icon} {temp}°C
        </div>
      </Html>
    </mesh>
  )
}

// Atmosphere glow
function Atmosphere() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001
    }
  })
  
  return (
    <mesh ref={meshRef} scale={[1.15, 1.15, 1.15]}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshBasicMaterial
        color="#00ffc8"
        transparent
        opacity={0.08}
        side={THREE.BackSide}
      />
    </mesh>
  )
}

// Main globe component
function Globe({ weatherData }: { weatherData: { lat: number; lng: number; temp: number; type: string }[] }) {
  const globeRef = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)
  
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0015
    }
  })
  
  return (
    <group>
      <Atmosphere />
      
      {/* Earth */}
      <Sphere ref={globeRef} args={[2, 64, 64]}>
        <meshStandardMaterial
          color="#1a1a3e"
          metalness={0.3}
          roughness={0.7}
          emissive="#0a0a1a"
          emissiveIntensity={0.5}
        />
      </Sphere>
      
      {/* Grid lines */}
      <group rotation={[0, 0, 0]}>
        {[...Array(12)].map((_, i) => (
          <mesh key={`lat-${i}`} rotation={[Math.PI / 2, 0, (i * Math.PI) / 6]}>
            <torusGeometry args={[2.01, 0.003, 8, 100]} />
            <meshBasicMaterial color="#00ffc8" transparent opacity={0.2} />
          </mesh>
        ))}
        {[...Array(6)].map((_, i) => (
          <mesh key={`lng-${i}`} rotation={[0, 0, (i * Math.PI) / 6]}>
            <torusGeometry args={[2.01, 0.003, 8, 100]} />
            <meshBasicMaterial color="#00ffc8" transparent opacity={0.2} />
          </mesh>
        ))}
      </group>
      
      {/* Weather points */}
      {weatherData.map((point, i) => (
        <WeatherPoint key={i} {...point} />
      ))}
      
      {/* Cloud layer */}
      <Sphere ref={cloudsRef} args={[2.03, 32, 32]}>
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.05}
          depthWrite={false}
        />
      </Sphere>
    </group>
  )
}

// Stars background
function Stars() {
  const starsRef = useRef<THREE.Points>(null)
  
  const starPositions = useMemo(() => {
    const positions = new Float32Array(3000)
    for (let i = 0; i < 1000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100
    }
    return positions
  }, [])
  
  useFrame(() => {
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.0001
    }
  })
  
  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={1000}
          array={starPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#ffffff" transparent opacity={0.8} sizeAttenuation />
    </points>
  )
}

// YouTube Player component
function YouTubePlayer({ isPlaying, onToggle, volume, onVolumeChange }: { 
  isPlaying: boolean
  onToggle: () => void
  volume: number
  onVolumeChange: (v: number) => void
}) {
  const [currentPlaylist] = useState(() => 
    LOFI_PLAYLISTS[Math.floor(Math.random() * LOFI_PLAYLISTS.length)]
  )
  
  return (
    <div className="fixed top-6 right-6 z-50">
      <div className="backdrop-blur-xl rounded-2xl p-4 border border-cyan-500/20"
        style={{
          background: 'linear-gradient(135deg, rgba(10, 10, 30, 0.9), rgba(20, 20, 50, 0.8))',
          boxShadow: '0 0 40px rgba(0, 255, 200, 0.1), inset 0 0 20px rgba(0, 255, 200, 0.05)',
        }}>
        <div className="flex items-center gap-4">
          <button
            onClick={onToggle}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{
              background: isPlaying 
                ? 'linear-gradient(135deg, #00ffc8, #00aaff)' 
                : 'rgba(255, 255, 255, 0.1)',
              boxShadow: isPlaying ? '0 0 20px rgba(0, 255, 200, 0.5)' : 'none',
            }}
          >
            {isPlaying ? (
              <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          
          <div className="flex flex-col gap-2">
            <span className="text-cyan-400 text-xs font-medium tracking-wider" style={{ fontFamily: 'Orbitron' }}>
              LO-FI RADIO
            </span>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-400/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="w-20 h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #00ffc8 ${volume}%, rgba(255,255,255,0.2) ${volume}%)`,
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Hidden YouTube iframe */}
        {isPlaying && (
          <iframe
            className="hidden"
            src={`https://www.youtube.com/embed/videoseries?list=${currentPlaylist}&autoplay=1&loop=1`}
            allow="autoplay"
            title="Lo-fi playlist"
          />
        )}
      </div>
    </div>
  )
}

// Time display
function TimeDisplay() {
  const [time, setTime] = useState(new Date())
  
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="fixed top-6 left-6 z-50">
      <div className="backdrop-blur-xl rounded-2xl p-5 border border-cyan-500/20"
        style={{
          background: 'linear-gradient(135deg, rgba(10, 10, 30, 0.9), rgba(20, 20, 50, 0.8))',
          boxShadow: '0 0 40px rgba(0, 255, 200, 0.1), inset 0 0 20px rgba(0, 255, 200, 0.05)',
        }}>
        <div className="text-4xl font-bold tracking-wider text-white mb-1" style={{ fontFamily: 'Orbitron' }}>
          {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
        </div>
        <div className="text-cyan-400/60 text-sm tracking-widest" style={{ fontFamily: 'Quicksand' }}>
          {time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>
    </div>
  )
}

// Weather legend
function WeatherLegend() {
  return (
    <div className="fixed bottom-24 left-6 z-50">
      <div className="backdrop-blur-xl rounded-2xl p-4 border border-cyan-500/20"
        style={{
          background: 'linear-gradient(135deg, rgba(10, 10, 30, 0.9), rgba(20, 20, 50, 0.8))',
          boxShadow: '0 0 40px rgba(0, 255, 200, 0.1), inset 0 0 20px rgba(0, 255, 200, 0.05)',
        }}>
        <div className="text-cyan-400 text-xs font-medium tracking-wider mb-3" style={{ fontFamily: 'Orbitron' }}>
          TEMPERATURE
        </div>
        <div className="flex items-center gap-2 text-xs text-white/70" style={{ fontFamily: 'Quicksand' }}>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ background: '#00ffff' }} />
            <span>&lt;0°</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ background: '#00aaff' }} />
            <span>&lt;10°</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ background: '#00ff88' }} />
            <span>&lt;20°</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ background: '#ffaa00' }} />
            <span>&lt;30°</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ background: '#ff4444' }} />
            <span>30°+</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main title
function MainTitle() {
  return (
    <div className="fixed bottom-24 right-6 z-50 text-right">
      <h1 className="text-5xl font-black text-transparent bg-clip-text tracking-tight"
        style={{
          fontFamily: 'Orbitron',
          backgroundImage: 'linear-gradient(135deg, #00ffc8, #00aaff, #ff00aa)',
          textShadow: '0 0 60px rgba(0, 255, 200, 0.3)',
        }}>
        LOFI GLOBE
      </h1>
      <p className="text-white/40 text-sm mt-2 tracking-widest" style={{ fontFamily: 'Quicksand' }}>
        AMBIENT WEATHER VISUALIZATION
      </p>
    </div>
  )
}

// Loading screen
function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #050510 100%)',
      }}>
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-cyan-400/40 animate-pulse" />
          <div className="absolute inset-4 rounded-full border-2 border-cyan-300/60 animate-spin" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">🌍</span>
          </div>
        </div>
        <p className="text-cyan-400 tracking-[0.3em] text-sm animate-pulse" style={{ fontFamily: 'Orbitron' }}>
          LOADING EARTH DATA
        </p>
      </div>
    </div>
  )
}

// Footer
function Footer() {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 text-center">
      <p className="text-white/25 text-xs tracking-wider" style={{ fontFamily: 'Quicksand' }}>
        Requested by <span className="text-cyan-500/40">@JolupCCTV</span> · Built by <span className="text-cyan-500/40">@clonkbot</span>
      </p>
    </div>
  )
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(50)
  const [weatherData] = useState(generateWeatherData)
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2500)
    return () => clearTimeout(timer)
  }, [])
  
  useEffect(() => {
    if (!isLoading) {
      // Auto-play after loading (user can pause)
      const timer = setTimeout(() => setIsPlaying(true), 500)
      return () => clearTimeout(timer)
    }
  }, [isLoading])
  
  return (
    <div className="w-full h-full relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #0a0a2e 0%, #050510 70%, #000 100%)',
      }}>
      
      {isLoading && <LoadingScreen />}
      
      <div className={`transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        <TimeDisplay />
        <YouTubePlayer 
          isPlaying={isPlaying} 
          onToggle={() => setIsPlaying(!isPlaying)}
          volume={volume}
          onVolumeChange={setVolume}
        />
        <WeatherLegend />
        <MainTitle />
        <Footer />
        
        {/* 3D Canvas */}
        <Canvas
          camera={{ position: [0, 0, 6], fov: 45 }}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#00ffc8" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00aa" />
            <Stars />
            <Globe weatherData={weatherData} />
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              minDistance={4}
              maxDistance={10}
              autoRotate={false}
              rotateSpeed={0.5}
            />
          </Suspense>
        </Canvas>
        
        {/* Vignette overlay */}
        <div className="fixed inset-0 pointer-events-none z-40"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
          }} />
        
        {/* Scan lines effect */}
        <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,200,0.1) 2px, rgba(0,255,200,0.1) 4px)',
          }} />
      </div>
    </div>
  )
}