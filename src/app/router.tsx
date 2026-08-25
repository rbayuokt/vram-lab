import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/templates/AppLayout';
import { BitsPerPixelPlayground } from '@/playgrounds/BitsPerPixelPlayground/BitsPerPixelPlayground';
import { GlyphPlayground } from '@/playgrounds/GlyphPlayground/GlyphPlayground';
import { HardwareOverview } from '@/playgrounds/HardwareOverview/HardwareOverview';
import { HexInspector } from '@/playgrounds/HexInspector/HexInspector';
import { Home } from '@/playgrounds/Home/Home';
import { NaiveVsOptimized } from '@/playgrounds/NaiveVsOptimized/NaiveVsOptimized';
import { PalettePlayground } from '@/playgrounds/PalettePlayground/PalettePlayground';
import { PaletteSwapDemo } from '@/playgrounds/PaletteSwapDemo/PaletteSwapDemo';
import { TextureAtlasDemo } from '@/playgrounds/TextureAtlasDemo/TextureAtlasDemo';
import { TextureCalculator } from '@/playgrounds/TextureCalculator/TextureCalculator';
import { TextVsImagesDemo } from '@/playgrounds/TextVsImagesDemo/TextVsImagesDemo';
import { TilemapDemo } from '@/playgrounds/TilemapDemo/TilemapDemo';
import { VramChallenge } from '@/playgrounds/VramChallenge/VramChallenge';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'hardware', element: <HardwareOverview /> },
      { path: 'bits-per-pixel', element: <BitsPerPixelPlayground /> },
      { path: 'texture-calculator', element: <TextureCalculator /> },
      { path: 'clut', element: <PalettePlayground /> },
      { path: 'palette-swap', element: <PaletteSwapDemo /> },
      { path: 'atlas', element: <TextureAtlasDemo /> },
      { path: 'tilemap', element: <TilemapDemo /> },
      { path: 'glyphs', element: <GlyphPlayground /> },
      { path: 'text-vs-images', element: <TextVsImagesDemo /> },
      { path: 'hex', element: <HexInspector /> },
      { path: 'challenge', element: <VramChallenge /> },
      { path: 'naive-vs-optimized', element: <NaiveVsOptimized /> },
      { path: '*', element: <Home /> },
    ],
  },
]);
