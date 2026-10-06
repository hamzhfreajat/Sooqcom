import { makeRoute } from "@/views/route";

const route = makeRoute("ar");

export const generateMetadata = route.generateMetadata;
export default route.Page;
