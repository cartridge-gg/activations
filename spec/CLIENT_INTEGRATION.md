# Client Integration Guide

## Quiz Question Management

The contracts now store **only answer hashes** on-chain, not the full questions. This reduces gas costs and gives you more flexibility on the client side.

### Contract Changes

1. **QuizQuestion model** - Now stores only `{ index: u32, answer_hash: felt252 }`
2. **set_quiz()** - Takes only `answer_hashes: Array<felt252>` (no questions parameter)
3. **Removed functions**:
   - `get_quiz_questions_for_wallet()` - Questions are now client-side only
   - `get_quiz_question()` - No longer needed

### Client Implementation

#### 1. Create Shared Quiz Configuration

Create a configuration file that both deployment scripts and the client can use:

```toml
# config/quiz.toml
[[questions]]
id = 0
question = "What does 'Waza' represent in Japanese martial arts?"
answer = "technique"

[[questions]]
id = 1
question = "What is the philosophy of 'Chi'?"
answer = "life force"

# ... 8 more questions for total of 10
```

#### 2. Question Selection Logic (Client-Side)

The client must implement the same deterministic selection logic as the contract:

```typescript
import { poseidonHashMany } from '@scure/starknet';

function selectQuestionsForWallet(walletAddress: string): number[] {
  const seed = BigInt(walletAddress);

  // Generate 3 deterministic hashes
  const hash1 = poseidonHashMany([seed, 1n]);
  const hash2 = poseidonHashMany([seed, 2n]);
  const hash3 = poseidonHashMany([seed, 3n]);

  // Convert to indices 0-9
  let idx1 = Number(hash1 % 10n);
  let idx2 = Number(hash2 % 10n);
  let idx3 = Number(hash3 % 10n);

  // Ensure uniqueness (same logic as contract)
  if (idx2 === idx1) {
    idx2 = (idx2 + 1) % 10;
  }
  if (idx3 === idx1 || idx3 === idx2) {
    idx3 = (idx3 + 1) % 10;
    if (idx3 === idx1 || idx3 === idx2) {
      idx3 = (idx3 + 1) % 10;
    }
  }

  return [idx1, idx2, idx3];
}
```

#### 3. Display Questions

```typescript
function getQuestionsForWallet(walletAddress: string, quizConfig: QuizConfig) {
  const indices = selectQuestionsForWallet(walletAddress);
  return indices.map(idx => quizConfig.questions[idx]);
}
```

#### 4. Submit Answers

When the user submits answers, hash them and send to the contract:

```typescript
async function submitQuizAnswers(
  walletAddress: string,
  userAnswers: string[]
) {
  // Hash the answers (same algorithm used when creating the quiz)
  const hashedAnswers = userAnswers.map(answer =>
    poseidonHashMany([BigInt(toHex(answer))])
  );

  // Call contract
  await contract.complete_chi(hashedAnswers);
}
```

### Deployment Script

When deploying, compute hashes from your config:

```typescript
import { readFileSync } from 'fs';
import { parse } from 'toml';

const quiz = parse(readFileSync('config/quiz.toml', 'utf-8'));
const answerHashes = quiz.questions.map(q =>
  poseidonHashMany([BigInt(toHex(q.answer))])
);

// Deploy and configure
await contract.set_quiz(answerHashes);
```

## Benefits of This Approach

1. **Lower gas costs** - No ByteArray storage on-chain
2. **Flexibility** - Update questions without contract changes (as long as hashes match)
3. **Internationalization** - Serve different language versions from client
4. **Clean separation** - Contract validates, client presents
5. **Anti-scraping** - Questions not directly readable from blockchain

## Notes

- The deterministic selection ensures the same wallet always gets the same 3 questions
- The contract validates that submitted answer hashes match stored hashes
- Questions can be stored in your repo, CDN, or any storage solution
- Make sure your hashing algorithm matches exactly between client and deployment
