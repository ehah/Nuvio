import type { ComponentPropsWithoutRef, ReactNode } from "react";

type TableProps = ComponentPropsWithoutRef<"table"> & {
  children: ReactNode;
};

type TableHeaderProps = ComponentPropsWithoutRef<"thead"> & {
  children: ReactNode;
};

type TableBodyProps = ComponentPropsWithoutRef<"tbody"> & {
  children: ReactNode;
};

type TableRowProps = ComponentPropsWithoutRef<"tr"> & {
  children: ReactNode;
};

type TableCellProps = ComponentPropsWithoutRef<"td"> & {
  children: ReactNode;
  isHeader?: boolean;
};

const Table = ({ children, className, ...rest }: TableProps) => {
  return (
    <table className={`min-w-full ${className ?? ""}`} {...rest}>
      {children}
    </table>
  );
};

const TableHeader = ({ children, className, ...rest }: TableHeaderProps) => {
  return (
    <thead className={className} {...rest}>
      {children}
    </thead>
  );
};

const TableBody = ({ children, className, ...rest }: TableBodyProps) => {
  return (
    <tbody className={className} {...rest}>
      {children}
    </tbody>
  );
};

const TableRow = ({ children, className, ...rest }: TableRowProps) => {
  return (
    <tr className={className} {...rest}>
      {children}
    </tr>
  );
};

const TableCell = ({ children, isHeader = false, className, ...rest }: TableCellProps) => {
  const CellTag = isHeader ? "th" : "td";
  return (
    <CellTag className={className} {...rest}>
      {children}
    </CellTag>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
