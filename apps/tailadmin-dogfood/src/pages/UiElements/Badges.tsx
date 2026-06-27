import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Badge from "../../components/ui/badge/Badge";
import { PlusIcon } from "../../icons";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
export default function Badges() {
  return (
    <div>
      <PageMeta
        title="React.js Badges Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Badges Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Badges" />
      <h1
        data-nuvio-id="badges.page.title"
        className="sr-only text-base font-medium text-purple-600"
      >
        Badges
      </h1>
      <div className="space-y-5 sm:space-y-6">
        <div
          data-nuvio-id="badges.light.card"
          className="bg-white border border-purple-300 rounded-md p-6 shadow-sm"
        >
          <div className="px-6 py-5">
            <h3 className="text-base font-medium text-gray-800">
              With Light Background
            </h3>
          </div>
          <div className="border-t border-gray-100 p-4 sm:p-6">
            <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
              <span
                data-nuvio-id="badges.demo.primary"
                className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700"
              >
                Primary
              </span>
              <span
                data-nuvio-id="badges.demo.success"
                className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700"
              >
                Success
              </span>
              <Badge variant="light" color="error">
                Error
              </Badge>{" "}
              <Badge variant="light" color="warning">
                Warning
              </Badge>{" "}
              <Badge variant="light" color="info">
                Info
              </Badge>
              <Badge variant="light" color="light">
                Light
              </Badge>
              <Badge variant="light" color="dark">
                Dark
              </Badge>
            </div>
          </div>
        </div>
        <ComponentCard title="With Solid Background">
          <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
            {/* Light Variant */}
            <Badge variant="solid" color="primary">
              Primary
            </Badge>
            <Badge variant="solid" color="success">
              Success
            </Badge>{" "}
            <Badge variant="solid" color="error">
              Error
            </Badge>{" "}
            <Badge variant="solid" color="warning">
              Warning
            </Badge>{" "}
            <Badge variant="solid" color="info">
              Info
            </Badge>
            <Badge variant="solid" color="light">
              Light
            </Badge>
            <Badge variant="solid" color="dark">
              Dark
            </Badge>
          </div>
        </ComponentCard>
        <ComponentCard title="Light Background with Left Icon">
          <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
            <Badge variant="light" color="primary" startIcon={<PlusIcon />}>
              Primary
            </Badge>
            <Badge variant="light" color="success" startIcon={<PlusIcon />}>
              Success
            </Badge>{" "}
            <Badge variant="light" color="error" startIcon={<PlusIcon />}>
              Error
            </Badge>{" "}
            <Badge variant="light" color="warning" startIcon={<PlusIcon />}>
              Warning
            </Badge>{" "}
            <Badge variant="light" color="info" startIcon={<PlusIcon />}>
              Info
            </Badge>
            <Badge variant="light" color="light" startIcon={<PlusIcon />}>
              Light
            </Badge>
            <Badge variant="light" color="dark" startIcon={<PlusIcon />}>
              Dark
            </Badge>
          </div>
        </ComponentCard>
        <ComponentCard title="Solid Background with Left Icon">
          <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
            <Badge variant="solid" color="primary" startIcon={<PlusIcon />}>
              Primary
            </Badge>
            <Badge variant="solid" color="success" startIcon={<PlusIcon />}>
              Success
            </Badge>{" "}
            <Badge variant="solid" color="error" startIcon={<PlusIcon />}>
              Error
            </Badge>{" "}
            <Badge variant="solid" color="warning" startIcon={<PlusIcon />}>
              Warning
            </Badge>{" "}
            <Badge variant="solid" color="info" startIcon={<PlusIcon />}>
              Info
            </Badge>
            <Badge variant="solid" color="light" startIcon={<PlusIcon />}>
              Light
            </Badge>
            <Badge variant="solid" color="dark" startIcon={<PlusIcon />}>
              Dark
            </Badge>
          </div>
        </ComponentCard>
        <ComponentCard title="Light Background with Right Icon">
          <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
            <Badge variant="light" color="primary" endIcon={<PlusIcon />}>
              Primary
            </Badge>
            <Badge variant="light" color="success" endIcon={<PlusIcon />}>
              Success
            </Badge>{" "}
            <Badge variant="light" color="error" endIcon={<PlusIcon />}>
              Error
            </Badge>{" "}
            <Badge variant="light" color="warning" endIcon={<PlusIcon />}>
              Warning
            </Badge>{" "}
            <Badge variant="light" color="info" endIcon={<PlusIcon />}>
              Info
            </Badge>
            <Badge variant="light" color="light" endIcon={<PlusIcon />}>
              Light
            </Badge>
            <Badge variant="light" color="dark" endIcon={<PlusIcon />}>
              Dark
            </Badge>
          </div>
        </ComponentCard>
        <ComponentCard title="Solid Background with Right Icon">
          <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
            <Badge variant="solid" color="primary" endIcon={<PlusIcon />}>
              Primary
            </Badge>
            <Badge variant="solid" color="success" endIcon={<PlusIcon />}>
              Success
            </Badge>{" "}
            <Badge variant="solid" color="error" endIcon={<PlusIcon />}>
              Error
            </Badge>{" "}
            <Badge variant="solid" color="warning" endIcon={<PlusIcon />}>
              Warning
            </Badge>{" "}
            <Badge variant="solid" color="info" endIcon={<PlusIcon />}>
              Info
            </Badge>
            <Badge variant="solid" color="light" endIcon={<PlusIcon />}>
              Light
            </Badge>
            <Badge variant="solid" color="dark" endIcon={<PlusIcon />}>
              Dark
            </Badge>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
