"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "./client-api";

export interface SelectOption {
  label: string;
  value: string;
}

interface ApiEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
}

interface ApiLeaveType {
  id: string;
  name: string;
  code: string;
}

interface ApiPayrollRun {
  id: string;
  month: number;
  year: number;
  status: string;
}

interface ApiInsurancePolicy {
  id: string;
  provider: string;
  policyNumber: string;
  employee: { firstName: string; lastName: string };
}



export function useEmployeeOptions() {
  const [options, setOptions] = useState<SelectOption[]>([{ label: "Aarav Mehta - EMP-1001", value: "emp_1001" }]);

  useEffect(() => {
    function load() {
      apiFetch<ApiEmployee[]>("/employees")
        .then((body) => {
          if (!body.data?.length) return;
          setOptions(
            body.data.map((employee) => ({
              label: `${employee.firstName} ${employee.lastName} - ${employee.employeeCode}`,
              value: employee.id,
            })),
          );
        })
        .catch(() => undefined);
    }

    load();

    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ scope: string }>;
      if (custom.detail?.scope === "employees" || custom.detail?.scope === "all") {
        load();
      }
    };
    window.addEventListener("skylinx:data-refresh", handler);
    return () => window.removeEventListener("skylinx:data-refresh", handler);
  }, []);

  return options;
}

export function useLeaveTypeOptions() {
  const [options, setOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    apiFetch<ApiLeaveType[]>("/leave/types")
      .then((body) => {
        if (!body.data?.length) return;
        setOptions(body.data.map((leaveType) => ({ label: `${leaveType.name} (${leaveType.code})`, value: leaveType.id })));
      })
      .catch(() => undefined);
  }, []);

  return options;
}

export function usePayrollRunOptions() {
  const [options, setOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    apiFetch<ApiPayrollRun[]>("/payroll/runs")
      .then((body) => {
        if (!body.data?.length) return;
        setOptions(
          body.data.map((run) => ({
            label: `${run.month}/${run.year} - ${run.status}`,
            value: run.id,
          })),
        );
      })
      .catch(() => undefined);
  }, []);

  return { options, setOptions };
}

interface ApiDepartment {
  id: string;
  name: string;
  code: string;
}

interface ApiDesignation {
  id: string;
  title: string;
  departmentId: string | null;
}

interface ApiLocation {
  id: string;
  name: string;
  city: string;
}

function useOrgOptions<T>(path: string, scope: string, toOption: (item: T) => SelectOption, defaults: SelectOption[]) {
  const [options, setOptions] = useState<SelectOption[]>(defaults);

  useEffect(() => {
    function load() {
      apiFetch<T[]>(path)
        .then((body) => {
          if (!body.data?.length) return;
          setOptions(body.data.map(toOption));
        })
        .catch(() => undefined);
    }

    load();

    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ scope: string }>;
      if (custom.detail?.scope === scope || custom.detail?.scope === "all") {
        load();
      }
    };
    window.addEventListener("skylinx:data-refresh", handler);
    return () => window.removeEventListener("skylinx:data-refresh", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, scope]);

  return options;
}

export function useDepartmentOptions() {
  return useOrgOptions<ApiDepartment>(
    "/organization/departments",
    "organization",
    (dept) => ({ label: dept.name, value: dept.id }),
    [],
  );
}

export function useDesignationOptions() {
  return useOrgOptions<ApiDesignation>(
    "/organization/designations",
    "organization",
    (desig) => ({ label: desig.title, value: desig.id }),
    [],
  );
}

export function useLocationOptions() {
  return useOrgOptions<ApiLocation>(
    "/organization/locations",
    "organization",
    (loc) => ({ label: loc.name, value: loc.id }),
    [],
  );
}

export function useInsurancePolicyOptions() {
  const [options, setOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    apiFetch<ApiInsurancePolicy[]>("/insurance/policies")
      .then((body) => {
        if (!body.data?.length) return;
        setOptions(
          body.data.map((policy) => ({
            label: `${policy.provider} - ${policy.policyNumber} (${policy.employee.firstName} ${policy.employee.lastName})`,
            value: policy.id,
          })),
        );
      })
      .catch(() => undefined);
  }, []);

  return { options, setOptions };
}


