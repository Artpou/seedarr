const FLAGS_API_URL = "https://flagsapi.com";

export function getFlagUrl(country?: string) {
  console.log(country);
  if (!country) return "";
  switch (country.toUpperCase()) {
    case "EN":
      country = "US";
      break;
    case "KO":
      country = "KR";
      break;
    case "ZH":
      country = "TW";
      break;
    default:
      country = country.toUpperCase();
      break;
  }
  return `${FLAGS_API_URL}/${country}/flat/64.png`;
}
