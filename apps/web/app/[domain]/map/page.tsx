'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import MapboxMap from '@/components/custom/mapbox-map'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function MapPage() {
  const [showStates, setShowStates] = useState(true)
  const [showMunicipalities, setShowMunicipalities] = useState(false)
  const [statesGeoJson, setStatesGeoJson] = useState<
    GeoJSON.FeatureCollection | GeoJSON.Feature | undefined
  >(undefined)
  const [municipalitiesGeoJson, setMunicipalitiesGeoJson] = useState<
    GeoJSON.FeatureCollection | GeoJSON.Feature | undefined
  >(undefined)
  const [loading, setLoading] = useState(false)

  // Token do Mapbox (deve ser configurado no .env)
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Busca estados
        const statesRes = await fetch(`${API_URL}/api/map/states`)
        if (statesRes.ok) {
          const data = await statesRes.json()
          setStatesGeoJson(data)
        }

        // Busca municípios (inicialmente todos ou por demanda)
        const munRes = await fetch(`${API_URL}/api/map/municipalities`)
        if (munRes.ok) {
          const data = await munRes.json()
          setMunicipalitiesGeoJson(data)
        }
      } catch (error) {
        console.error('Error fetching map data:', error)
        toast.error('Erro ao carregar dados geográficos.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [API_URL])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Mapa Geográfico</h1>
        <p className="text-muted-foreground">
          Visualize as malhas estaduais e municipais do IBGE integradas ao sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Painel de Controle */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Camadas</CardTitle>
            <CardDescription>Habilite ou desabilite as malhas no mapa.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="states-toggle" className="flex flex-col gap-1 cursor-pointer">
                <span>Malhas Estaduais</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Limites oficiais das UFs
                </span>
              </Label>
              <Switch id="states-toggle" checked={showStates} onCheckedChange={setShowStates} />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="mun-toggle" className="flex flex-col gap-1 cursor-pointer">
                <span>Malhas Municipais</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Limites de todos os municípios
                </span>
              </Label>
              <Switch
                id="mun-toggle"
                checked={showMunicipalities}
                onCheckedChange={setShowMunicipalities}
              />
            </div>

            {loading && (
              <div className="pt-4 flex items-center justify-center gap-2 text-sm text-primary font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando dados...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mapa */}
        <Card className="lg:col-span-3 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card shadow-lg border">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm font-medium">Processando malhas geográficas...</span>
              </div>
            </div>
          )}
          <CardContent className="p-0 h-[600px]">
            <MapboxMap
              token={mapboxToken}
              statesGeoJson={statesGeoJson}
              municipalitiesGeoJson={municipalitiesGeoJson}
              showStates={showStates}
              showMunicipalities={showMunicipalities}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
