// import AppError from '../errors/AppError';

import { getRepository, getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  supportedTypes = ['income', 'outcome'];

  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepositoy = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    await this.checkIfTransactionsIsValid(type, transactionsRepositoy, value);

    let transactionCategory = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!transactionCategory) {
      transactionCategory = categoriesRepository.create({ title: category });
    }

    await categoriesRepository.save(transactionCategory);

    const transaction = transactionsRepositoy.create({
      title,
      value,
      type,
      category: transactionCategory,
    });

    await transactionsRepositoy.save(transaction);

    return transaction;
  }

  private async checkIfTransactionsIsValid(
    type: string,
    transactionsRepositoy: TransactionsRepository,
    value: number,
  ): Promise<void> {
    if (!this.supportedTypes.includes(type)) {
      throw new AppError('This type is not supported');
    }

    if (type === 'outcome') {
      const balances = await transactionsRepositoy.getBalance();
      if (balances.total - value < 0)
        throw new AppError(
          'This transaction cannot be submitted. The resulting balance should be higher than 0.',
        );
    }
  }
}

export default CreateTransactionService;
