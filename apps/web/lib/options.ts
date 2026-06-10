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


