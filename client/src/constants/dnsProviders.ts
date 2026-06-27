export type DnsProvider = {
  id: string;
  name: string;
  guideUrl: string;
  quirks?: string;
};

export const DNS_PROVIDERS: DnsProvider[] = [
  {
    id: "godaddy",
    name: "GoDaddy",
    guideUrl: "https://www.godaddy.com/help/add-an-a-record-19238",
    quirks: "Do not append your domain name to the Host field. Use exactly '@' or '_classgrid-verify'."
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    guideUrl: "https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/",
    quirks: "Crucial: Make sure the Proxy Status for the A record is set to 'DNS Only' (Gray Cloud). If it is set to 'Proxied' (Orange Cloud), the verification will fail."
  },
  {
    id: "namecheap",
    name: "Namecheap",
    guideUrl: "https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain/",
    quirks: "Enter exactly '@' or '_classgrid-verify' in the Host field. Namecheap will automatically append your domain."
  },
  {
    id: "google_domains",
    name: "Google Domains",
    guideUrl: "https://support.google.com/domains/answer/3290350",
    quirks: "Leave the 'Host name' field blank to represent the root domain (@)."
  },
  {
    id: "aws_route53",
    name: "AWS Route 53",
    guideUrl: "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-creating.html",
    quirks: "Leave the Record Name blank for the apex/root domain."
  },
  {
    id: "hostinger",
    name: "Hostinger",
    guideUrl: "https://support.hostinger.com/en/articles/1583227-how-to-manage-my-dns-records-on-hpanel",
    quirks: "Use '@' for the root domain. Ensure no other A records exist for '@'."
  },
  {
    id: "bluehost",
    name: "Bluehost",
    guideUrl: "https://www.bluehost.com/help/article/dns-management-add-edit-or-delete-dns-entries",
    quirks: "Use '@' for the Host Record to point your root domain."
  },
  {
    id: "siteground",
    name: "SiteGround",
    guideUrl: "https://www.siteground.com/tutorials/cpanel/dns-zone-editor/",
    quirks: "Leave the Name field blank for the root domain, or use your exact domain name depending on the Site Tools interface."
  },
  {
    id: "digitalocean",
    name: "DigitalOcean",
    guideUrl: "https://docs.digitalocean.com/products/networking/dns/how-to/manage-records/",
    quirks: "Enter '@' in the Hostname field to direct to your root domain."
  },
  {
    id: "wix",
    name: "Wix",
    guideUrl: "https://support.wix.com/en/article/adding-or-updating-a-records-in-your-wix-account",
    quirks: "Leave the Host Name field blank to point the root domain."
  },
  {
    id: "squarespace",
    name: "Squarespace",
    guideUrl: "https://support.squarespace.com/hc/en-us/articles/360002101888-Adding-custom-DNS-records-to-your-Squarespace-domain",
    quirks: "Use '@' in the Host column for the root domain."
  },
  {
    id: "domaincom",
    name: "Domain.com",
    guideUrl: "https://www.domain.com/help/article/dns-management-how-to-update-dns-records",
    quirks: "Use '@' for the Name field. Delete any conflicting parked A records."
  },
  {
    id: "hostgator",
    name: "HostGator",
    guideUrl: "https://www.hostgator.com/help/article/how-to-change-dns-zones-mx-cname-and-a-records",
    quirks: "Use your bare domain (e.g. example.com) or '@' depending on the cPanel version."
  },
  {
    id: "porkbun",
    name: "Porkbun",
    guideUrl: "https://kb.porkbun.com/article/68-how-to-add-edit-or-delete-dns-records",
    quirks: "Leave the Host field completely blank to create a root record."
  },
  {
    id: "ionos",
    name: "IONOS (1&1)",
    guideUrl: "https://www.ionos.com/help/domains/configuring-your-ip-address/changing-a-domains-ipv4-address-a-record/",
    quirks: "Leave the Host Name field empty for the root domain."
  },
  {
    id: "networksolutions",
    name: "Network Solutions",
    guideUrl: "https://www.networksolutions.com/support/how-to-manage-advanced-dns-records/",
    quirks: "Use '@' or leave blank. Some older interfaces require you to select a radio button for 'None' or '@'."
  },
  {
    id: "dreamhost",
    name: "DreamHost",
    guideUrl: "https://help.dreamhost.com/hc/en-us/articles/215414867-How-do-I-add-custom-DNS-records-",
    quirks: "Leave the Name field blank for the root domain."
  },
  {
    id: "cpanel",
    name: "cPanel (Generic)",
    guideUrl: "https://docs.cpanel.net/cpanel/domains/zone-editor/",
    quirks: "Usually requires you to enter the fully qualified domain name (e.g., example.com.) with a trailing dot, or just '@'."
  },
  {
    id: "hover",
    name: "Hover",
    guideUrl: "https://help.hover.com/hc/en-us/articles/217282457-Managing-DNS-records",
    quirks: "Use '@' for the root domain."
  },
  {
    id: "dynadot",
    name: "Dynadot",
    guideUrl: "https://www.dynadot.com/community/help/question/create-A-record",
    quirks: "Leave the Subdomain field blank to apply the record to your root domain."
  },
  {
    id: "namecom",
    name: "Name.com",
    guideUrl: "https://www.name.com/support/articles/205188508-Adding-an-A-record",
    quirks: "Leave the Host field blank for the root domain."
  },
  {
    id: "gandi",
    name: "Gandi",
    guideUrl: "https://docs.gandi.net/en/domain_names/common_operations/dns_records.html",
    quirks: "Use '@' as the Name for the root domain."
  },
  {
    id: "enom",
    name: "eNom",
    guideUrl: "https://help.enom.com/hc/en-us/articles/115000474012-How-to-change-host-records",
    quirks: "Use '@' for the Host Name."
  },
  {
    id: "vercel",
    name: "Vercel (External Domain)",
    guideUrl: "https://vercel.com/docs/concepts/projects/domains/add-a-domain",
    quirks: "If your domain is managed by Vercel, you do not need to configure DNS records. It will be verified automatically."
  },
  {
    id: "netlify",
    name: "Netlify DNS",
    guideUrl: "https://docs.netlify.com/domains-https/netlify-dns/records/",
    quirks: "Use '@' for the Name field."
  },
  {
    id: "cloudflare_pages",
    name: "Cloudflare Pages",
    guideUrl: "https://developers.cloudflare.com/pages/get-started/custom-domains/",
    quirks: "Ensure Proxy Status is 'DNS Only'."
  },
  {
    id: "firebase",
    name: "Firebase Hosting",
    guideUrl: "https://firebase.google.com/docs/hosting/custom-domain",
    quirks: "Use '@' for the root domain."
  },
  {
    id: "heroku",
    name: "Heroku",
    guideUrl: "https://devcenter.heroku.com/articles/custom-domains",
    quirks: "Heroku typically uses ALIAS or ANAME records for the root domain instead of A records if supported by your provider."
  },
  {
    id: "render",
    name: "Render",
    guideUrl: "https://render.com/docs/custom-domains",
    quirks: "Configure an ALIAS/ANAME record or use the provided A record IP."
  },
  {
    id: "fly_io",
    name: "Fly.io",
    guideUrl: "https://fly.io/docs/app-guides/custom-domains-with-fly/",
    quirks: "Fly provides specific IPv4 and IPv6 addresses. Ensure A and AAAA records are set correctly."
  },
  {
    id: "railway",
    name: "Railway",
    guideUrl: "https://docs.railway.app/reference/domains",
    quirks: "Use the provided CNAME for subdomains or ALIAS/A records for the root domain."
  },
  {
    id: "supabase",
    name: "Supabase",
    guideUrl: "https://supabase.com/docs/guides/platform/custom-domains",
    quirks: "Supabase custom domains usually require CNAME setup."
  },
  {
    id: "other",
    name: "Other / Unlisted Provider",
    guideUrl: "https://vercel.com/docs/concepts/projects/domains/add-a-domain",
    quirks: "General Rule: Use '@' or leave the Name/Host field blank for the root domain. Do not type your domain name (e.g. use '_classgrid-verify', not '_classgrid-verify.example.com')."
  }
];
