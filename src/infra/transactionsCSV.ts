import csvParse from 'csv-parse';
import fs from 'fs';

interface TransactionDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

async function read(filePath: string): Promise<TransactionDTO[]> {
  const readCSVStream = fs.createReadStream(filePath);

  const parseStream = csvParse({
    from_line: 2,
    ltrim: true,
    rtrim: true,
  });

  const parseCSV = readCSVStream.pipe(parseStream);

  const lines: TransactionDTO[] = [];

  parseCSV.on('data', line => {
    const [title, type, value, category] = line;
    if (title && type && value) lines.push({ title, type, value, category });
  });

  await new Promise(resolve => {
    parseCSV.on('end', resolve);
  });

  return lines;
}

export default read;
