// EmployeesTab.jsx
import { useState } from "react";
import DataTable from "./DataTable.jsx";
import EmployeeDrawer from "./EmployeeDrawer.jsx";
import { CheckCircle2, XCircle } from "lucide-react";

export default function EmployeesTab({ snapshot, refreshSnapshot, currentUser }) {
  const [drawerEmp, setDrawerEmp] = useState(null);

  const rows = snapshot.employees.filter(e => e.employee_id !== currentUser.id); // hide logged-in user from list

  const columns = [
    {
      key: "name",
      label: "Name",
      render: r => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
            {r.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <div className="font-bold text-slate-900">{r.name}</div>
            <div className="mono text-[10px] text-slate-700">{r.employee_id}</div>
          </div>
        </div>
      )
    },
    {
      key: "email",
      label: "Email",
      render: r => <span className="text-xs text-slate-800">{r.email}</span>
    },
    {
      key: "department",
      label: "Department",
      render: r => <span className="text-xs text-slate-800">{r.department}</span>,
      filterValue: r => r.department
    },
    {
      key: "grade",
      label: "Grade",
      render: r => (
        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-300 text-xs font-semibold rounded">
          {r.grade}
        </span>
      ),
      filterValue: r => r.grade
    },
    {
      key: "certified",
      label: "Certified Panelist",
      render: r => r.is_certified_panelist ? (
        <CheckCircle2 size={16} className="text-emerald-600" />
      ) : (
        <XCircle size={16} className="text-slate-400" />
      ),
      filterValue: r => r.is_certified_panelist ? "Yes" : "No"
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      filterable: false,
      render: r => (
        <button
          onClick={() => setDrawerEmp(r)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded"
        >
          View
        </button>
      )
    }
  ];

  return (
    <div>
      <DataTable
        rows={rows}
        columns={columns}
        searchPlaceholder="Search employees by name, email, ID..."
        searchableFields={[r => r.name, r => r.email, r => r.employee_id]}
        emptyMessage="No employees found"
        rowKey={r => r.employee_id}
      />
      {drawerEmp && (
        <EmployeeDrawer
          employee={drawerEmp}
          snapshot={snapshot}
          refreshSnapshot={refreshSnapshot}
          currentUser={currentUser}
          onClose={() => setDrawerEmp(null)}
        />
      )}
    </div>
  );
}
