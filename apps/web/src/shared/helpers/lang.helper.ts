const FLAGS_API_URL = "https://flagsapi.com";

export function getFlagUrl(country: string) {
  return `${FLAGS_API_URL}/${country}/flat/64.png`;
}
