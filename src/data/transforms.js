export default {
  transforms: [
    {
      id: 'a248b600-8351-4bf4-9445-dbc716b1374d',
      name: 'Invoice',
      transform: '$sum(Account.Order.Product.(Price * Quantity))',
      description: 'JSONata transform for Invoice',
      jsondata: 'invoice',
      isActive: true,
    },
    {
      id: '403d9ad1-84f8-4f18-92fe-0f30dd03291e',
      name: 'Address',
      transform:
        "{\n  'name': FirstName & ' ' & Surname,\n  'mobile': Phone[type = 'mobile'].number\n}",
      description: 'JSONata transform for Address',
      jsondata: 'address',
      isActive: true,
    },
    {
      id: 'e90d3a1b-b78a-4e21-b4bd-0e409882e151',
      name: 'Schema',
      transform: '**.properties ~> $keys()',
      description: 'JSONata transform for Schema',
      jsondata: 'schema',
      isActive: true,
    },
    {
      id: '290207d3-8e18-4c25-af31-738feff4c477',
      name: 'Library',
      transform:
        "library.loans @ $L.books @ $B[$L.isbn = $B.isbn].customers[$L.customer = id].{\n  'customer': name,\n  'book': $B.title,\n  'due': $L.return\n}",
      description: 'JSONata transform for Library',
      jsondata: 'library',
      isActive: true,
    },
  ],
};
