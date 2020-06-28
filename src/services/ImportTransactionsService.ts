import { getRepository, In } from 'typeorm';
import fs from 'fs';
import Transaction from '../models/Transaction';
import readCSV from '../infra/transactionsCSV';
import Category from '../models/Category';

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const toImportTransactions = await readCSV(filePath);
    const transactionsRepository = getRepository(Transaction);
    const categoriesRepository = getRepository(Category);

    const existentCategories = await categoriesRepository.find({
      where: { title: In(toImportTransactions.map(i => i.category)) },
    });

    const newCategoriesTitles = toImportTransactions
      .map(i => i.category)
      .filter(i => !existentCategories.map(j => j.title).includes(i))
      .filter((item, index, self) => {
        return self.indexOf(item) === index;
      });

    const newCategories = categoriesRepository.create(
      newCategoriesTitles.map(i => ({
        title: i,
      })),
    );

    await categoriesRepository.save(newCategories);

    const categories = [...existentCategories, ...newCategories];

    const transactions = transactionsRepository.create(
      toImportTransactions.map(transaction => ({
        title: transaction.title,
        value: transaction.value,
        type: transaction.type,
        category: categories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await fs.promises.unlink(filePath);

    await transactionsRepository.save(transactions);

    return transactions;
  }
}

export default ImportTransactionsService;
