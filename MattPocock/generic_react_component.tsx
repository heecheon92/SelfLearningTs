import React from "react";

interface TableProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function Table<T>(props: TableProps<T>) {
  return null;
}

function Component() {
  return (
    <Table<{ id: number }> // awkward syntax but possible
      items={[{ id: 1 }]}
      renderItem={(item) => <div>{item.id}</div>}
    />
  );
}
