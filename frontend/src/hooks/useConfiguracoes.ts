import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  configService,
  type FonteMapsTipo,
  type PerfilVendedor,
} from "@/services/configService"
import type { ProvedorIA } from "@/types/config"

export function useConfiguracoes() {
  return useQuery({
    queryKey: ["configuracoes"],
    queryFn: configService.listar,
  })
}

export function useSalvarConfiguracao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ chave, valor }: { chave: ProvedorIA; valor: string }) =>
      configService.salvar(chave, valor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes"] })
      toast.success("Clave de API guardada.")
    },
  })
}

export function usePerfilVendedor() {
  return useQuery({
    queryKey: ["perfil-vendedor"],
    queryFn: configService.obterPerfilVendedor,
  })
}

export function useSalvarPerfilVendedor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (perfil: PerfilVendedor) => configService.salvarPerfilVendedor(perfil),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perfil-vendedor"] })
      toast.success("Perfil guardado - las próximas copias ya salen con tu voz.")
    },
  })
}

export function useProxiesScraper() {
  return useQuery({
    queryKey: ["scraper-proxies"],
    queryFn: configService.obterProxiesScraper,
  })
}

export function useSalvarProxiesScraper() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (proxies: string) => configService.salvarProxiesScraper(proxies),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scraper-proxies"] })
      toast.success("Configuración de proxy guardada.")
    },
  })
}

export function useFonteMaps() {
  return useQuery({
    queryKey: ["fonte-maps"],
    queryFn: configService.obterFonteMaps,
  })
}

export function useSalvarFonteMaps() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fonte, chave }: { fonte: FonteMapsTipo; chave?: string }) =>
      configService.salvarFonteMaps(fonte, chave),
    onSuccess: (dados) => {
      queryClient.invalidateQueries({ queryKey: ["fonte-maps"] })
      toast.success(
        dados.fonte === "places"
          ? "Fuente guardada: Google Places API (clave validada)."
          : "Fuente guardada: scraper local."
      )
    },
    onError: (erro: Error) => {
      toast.error(erro.message)
    },
  })
}
