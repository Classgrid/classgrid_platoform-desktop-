import axios from 'axios';

async function test() {
  const platformBranding = { name: "Classgrid" };
  let branding = platformBranding;
  let brandingError = false;
  let isMounted = true;
  let authType = "institution";
  let slug = "aec";

  const apiClient = axios.create({ baseURL: "https://api.classgrid.in" });
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      const normalized = { message: "Unexpected API error", code: "UNKNOWN" };
      return Promise.reject(normalized);
    }
  );

  async function getAuthBranding() {
    const response = await apiClient.get("/api/public/auth-branding", {
      params: { type: authType, slug: slug },
    });
    return response.data.branding;
  }

  try {
    const result = await getAuthBranding();
    if (isMounted) branding = result;
  } catch (error) {
    console.log("CATCH BLOCK REACHED");
    if (isMounted) {
      if (authType === "institution") {
        brandingError = true;
      } else {
        branding = platformBranding;
      }
    }
  }

  console.log({ brandingError, branding });
}

test().catch(console.error);
