import { makeRoute } from "@/views/route";

const route = makeRoute("en");

export const generateMetadata = route.generateMetadata;
export default route.Page;
