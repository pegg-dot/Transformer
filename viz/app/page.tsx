'use client'

import { MovieOrchestrator } from '@/components/movie/MovieOrchestrator'
import { SCENES } from '@/components/movie/sceneList'

export default function HomePage() {
  return <MovieOrchestrator scenes={SCENES} />
}
