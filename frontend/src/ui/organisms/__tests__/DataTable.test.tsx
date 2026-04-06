import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { DataTable, type Column } from '../DataTable';

type TestItem = {
  id: string;
  name: string;
  age: number;
};

describe('DataTable', () => {
  const data: TestItem[] = [
    { id: '1', name: 'John', age: 30 },
    { id: '2', name: 'Jane', age: 25 },
  ];

  const columns: Column<TestItem>[] = [
    { key: 'name', headerKey: 'Name' },
    { key: 'age', headerKey: 'Age' },
  ];

  it('renderiza correctamente', () => {
    render(
      <DataTable
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
      />
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('muestra datos correctamente', () => {
    render(
      <DataTable
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
      />
    );
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  it('usa render function cuando se proporciona', () => {
    const columnsWithRender: Column<TestItem>[] = [
      {
        key: 'name',
        headerKey: 'Name',
        render: (item) => <strong>{item.name}</strong>,
      },
    ];
    render(
      <DataTable
        data={data}
        columns={columnsWithRender}
        keyExtractor={(item) => item.id}
      />
    );
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('llama onRowClick al hacer click en fila', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(
      <DataTable
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
        onRowClick={onRowClick}
      />
    );

    const row = screen.getByText('John').closest('tr');
    if (row) {
      await user.click(row);
      expect(onRowClick).toHaveBeenCalledWith(data[0]);
    }
  });

  it('muestra paginacion cuando hay multiples paginas', () => {
    render(
      <DataTable
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
        page={1}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('llama onPageChange al cambiar pagina', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <DataTable
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
        page={1}
        totalPages={3}
        onPageChange={onPageChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find(btn => !btn.disabled && btn.textContent !== '');
    if (nextButton) {
      await user.click(nextButton);
      expect(onPageChange).toHaveBeenCalled();
    }
  });
});
