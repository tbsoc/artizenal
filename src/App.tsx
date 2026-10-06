import { Layout } from "@/components/Layout"
import { useRoute } from "@/lib/router"
import { Home } from "@/pages/Home"
import { Projects } from "@/pages/Projects"
import { ProjectPage } from "@/pages/ProjectPage"
import { CreateProject } from "@/pages/CreateProject"
import { Funds } from "@/pages/Funds"
import { FundPage } from "@/pages/FundPage"
import { ProposeFund } from "@/pages/ProposeFund"
import { Allocate } from "@/pages/Allocate"
import { Wallet } from "@/pages/Wallet"
import { Points } from "@/pages/Points"
import { How } from "@/pages/How"
import { Wealth } from "@/pages/Wealth"

export default function App() {
  const { path, parts, query } = useRoute()
  let page
  switch (parts[0]) {
    case undefined:
      page = <Home />
      break
    case "projects":
      page = <Projects key={query.toString()} query={query} />
      break
    case "p":
      page = <ProjectPage key={parts[1]} id={parts[1]} />
      break
    case "new":
      page = <CreateProject key={query.toString()} query={query} />
      break
    case "funds":
      page = <Funds />
      break
    case "f":
      page = <FundPage key={`${parts[1]}?${query.toString()}`} id={parts[1]} query={query} />
      break
    case "propose":
      page = <ProposeFund />
      break
    case "allocate":
      page = <Allocate />
      break
    case "wallet":
      page = <Wallet />
      break
    case "points":
      page = <Points />
      break
    case "wealth":
      page = <Wealth />
      break
    case "how":
      page = <How />
      break
    default:
      page = <Home />
  }
  return <Layout path={path}>{page}</Layout>
}
