'use client'

import React, { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapboxMapProps {
  token: string
  center?: [number, number]
  zoom?: number
  statesGeoJson?: GeoJSON.FeatureCollection | GeoJSON.Feature
  municipalitiesGeoJson?: GeoJSON.FeatureCollection | GeoJSON.Feature
  showStates?: boolean
  showMunicipalities?: boolean
}

export default function MapboxMap({
  token,
  center = [-50, -15],
  zoom = 3.5,
  statesGeoJson,
  municipalitiesGeoJson,
  showStates = false,
  showMunicipalities = false,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    mapboxgl.accessToken = token

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: center,
      zoom: zoom,
    })

    m.addControl(new mapboxgl.NavigationControl(), 'top-right')

    m.on('load', () => {
      // Source para Estados
      m.addSource('states', {
        type: 'geojson',
        data: statesGeoJson || { type: 'FeatureCollection', features: [] },
      })

      // Camada de preenchimento (Fill) para Estados
      m.addLayer({
        id: 'states-fill',
        type: 'fill',
        source: 'states',
        layout: {
          visibility: showStates ? 'visible' : 'none',
        },
        paint: {
          'fill-color': '#0080ff',
          'fill-opacity': 0.1,
        },
      })

      // Camada de borda (Line) para Estados
      m.addLayer({
        id: 'states-line',
        type: 'line',
        source: 'states',
        layout: {
          visibility: showStates ? 'visible' : 'none',
        },
        paint: {
          'line-color': '#0080ff',
          'line-width': 1.5,
        },
      })

      // Source para Municípios
      m.addSource('municipalities', {
        type: 'geojson',
        data: municipalitiesGeoJson || { type: 'FeatureCollection', features: [] },
      })

      // Camada de preenchimento para Municípios
      m.addLayer({
        id: 'municipalities-fill',
        type: 'fill',
        source: 'municipalities',
        layout: {
          visibility: showMunicipalities ? 'visible' : 'none',
        },
        paint: {
          'fill-color': '#ff8000',
          'fill-opacity': 0.1,
        },
      })

      // Camada de borda para Municípios
      m.addLayer({
        id: 'municipalities-line',
        type: 'line',
        source: 'municipalities',
        layout: {
          visibility: showMunicipalities ? 'visible' : 'none',
        },
        paint: {
          'line-color': '#ff8000',
          'line-width': 0.5,
        },
      })

      map.current = m
    })

    return () => {
      m.remove()
      map.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Atualiza visibilidade dos estados
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return
    const visibility = showStates ? 'visible' : 'none'
    if (map.current.getLayer('states-fill'))
      map.current.setLayoutProperty('states-fill', 'visibility', visibility)
    if (map.current.getLayer('states-line'))
      map.current.setLayoutProperty('states-line', 'visibility', visibility)
  }, [showStates])

  // Atualiza visibilidade dos municípios
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return
    const visibility = showMunicipalities ? 'visible' : 'none'
    if (map.current.getLayer('municipalities-fill'))
      map.current.setLayoutProperty('municipalities-fill', 'visibility', visibility)
    if (map.current.getLayer('municipalities-line'))
      map.current.setLayoutProperty('municipalities-line', 'visibility', visibility)
  }, [showMunicipalities])

  // Atualiza dados quando GeoJSON mudar
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return
    const source = map.current.getSource('states') as mapboxgl.GeoJSONSource
    if (source && statesGeoJson) source.setData(statesGeoJson)
  }, [statesGeoJson])

  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return
    const source = map.current.getSource('municipalities') as mapboxgl.GeoJSONSource
    if (source && municipalitiesGeoJson) source.setData(municipalitiesGeoJson)
  }, [municipalitiesGeoJson])

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-lg overflow-hidden border border-border shadow-sm">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  )
}
