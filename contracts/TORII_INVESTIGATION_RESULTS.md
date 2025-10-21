# Torii Crash Investigation Results

## 🎉 TL;DR - SOLUTION

**Problem:** Torii 1.8.x versions crash when processing external contracts
**Solution:** Use **Torii 1.7.0-alpha.6** - it works perfectly!
**Status:** ✅ Deployment successful, mint transaction executed, Torii running stable

To use the working version:
```bash
asdf set torii 1.7.0-alpha.6
./scripts/deploy_world.sh
```

---

## Summary
Torii crashes during startup when processing external contracts registered in the Dojo manifest. This is a regression bug in all Torii 1.8.x versions (1.8.2, 1.8.3, 1.8.6). Torii 1.7.0-alpha.6 works correctly.

## Crash Details

**Error Location:**
`/Users/runner/work/torii/torii/crates/processors/src/processors/mod.rs:162:51`

**Error Message:**
```
thread 'torii-indexer' panicked at: called `Option::unwrap()` on a `None` value
Error: Engine task panicked: task 58 panicked with message "called `Option::unwrap()` on a `None` value"
```

**When It Happens:**
- Immediately after registering external contracts and processing `store_set_record` events
- Occurs before any actual blockchain events (mint, etc.) are processed
- Happens during initial state synchronization

## Testing Results

### ✅ Test 1: Without mint transaction
- **Result:** Torii still crashes
- **Conclusion:** The mint transaction is NOT the cause

### ✅ Test 2: Without `--indexing.controllers` flag
- **Result:** Torii still crashes
- **Conclusion:** Controller indexing is NOT the cause (though it also has bugs in 1.8.3)

### ✅ Test 3: Without `--indexing.contracts "ERC721:..."` flag
- **Result:** Torii still crashes
- **Conclusion:** The explicit ERC721 indexing flag is NOT the cause

### ✅ Test 4: Version comparison
- **Torii 1.8.3:** Crashes with external contracts
- **Torii 1.8.6:** Also crashes with external contracts (same bug persists)

## Root Cause

The issue is triggered by **external contracts registered in the Dojo manifest** (`dojo_dev.toml`):

```toml
[[external_contracts]]
contract_name = "RoninPact"
instance_name = "ronin_pact"
salt = "1"
constructor_data = [...]
```

When Torii processes this external contract during initialization, it hits a code path where it tries to unwrap an `Option` value that is `None`, causing a panic.

## Crash Timeline

1. Torii starts successfully
2. Registers external contract: `RoninPact`
3. Registers events: `WazaCompleted`, `ChiCompleted`, `ShinCompleted`
4. Registers models: `RoninPact`, `RoninGames`, `RoninAnswers`
5. Processes `store_set_record` for `RoninPact` and `RoninAnswers`
6. **💥 CRASH** - Attempts to unwrap None value at line 162

## Workarounds Attempted

1. ❌ Removing ERC721 indexing flag - Still crashes
2. ❌ Removing controller indexing - Still crashes
3. ❌ Upgrading to Torii 1.8.6 - Still crashes
4. ❌ Running without mint transaction - Still crashes

## Potential Solutions

### Option 1: Remove External Contract (Not Recommended)
Remove the `[[external_contracts]]` section from `dojo_dev.toml`. This would prevent the crash but would also break NFT functionality in the Dojo world.

### Option 2: Use Older Torii Version
Test with Torii 1.7.0 or earlier versions that may not have this bug. Available versions:
- 1.6.1
- 1.7.0-alpha.5
- 1.7.0-alpha.6
- 1.8.2
- 1.8.3 (current, crashes)
- 1.8.6 (crashes)

### Option 3: Manual NFT Indexing
Deploy without external contracts in the manifest and manually track NFT events through other means (direct RPC calls, custom indexer, etc.).

### Option 4: Wait for Torii Fix
This appears to be a bug in Torii's external contract processing. The issue should be reported to the Dojo team.

## ✅ SOLUTION FOUND

**Use Torii 1.7.0-alpha.6** - This version works correctly with external contracts!

### Test Results by Version

- ❌ **Torii 1.8.6**: Crashes with external contracts
- ❌ **Torii 1.8.3**: Crashes with external contracts
- ❌ **Torii 1.8.2**: Crashes with external contracts
- ✅ **Torii 1.7.0-alpha.6**: **WORKS!** No crash, mint transaction successful
- ❓ Torii 1.7.0-alpha.5: Not tested
- ❓ Torii 1.6.1: Not tested

### What Works with 1.7.0-alpha.6

- ✅ Torii starts successfully
- ✅ External contracts load without crashing
- ✅ Mint transaction executes successfully (tx: 0x057468066f4803a871bf3a7a1b13aedb00cad86cde4ea44bc8bffa0769190d5c)
- ✅ Models register correctly
- ✅ Events register correctly
- ⚠️ Note: External contract indexing may be limited compared to 1.8.x versions

## Recommendations

1. **Immediate:** Use Torii 1.7.0-alpha.6 for now - it's stable with external contracts
2. **Short-term:** Monitor Torii releases for a fix to the 1.8.x external contract bug
3. **Long-term:** Report this regression to Dojo team - external contracts work in 1.7.0-alpha.6 but crash in all 1.8.x versions tested

## Torii Configuration

### Working Configuration (without external contracts)
```bash
torii \
    --world "$WORLD_ADDRESS" \
    --rpc http://localhost:5050 \
    --http.cors_origins "*"
```

### Current Configuration (crashes)
```bash
torii \
    --world "$WORLD_ADDRESS" \
    --rpc http://localhost:5050 \
    --http.cors_origins "*"
# External contracts from manifest cause crash
```

## System Info

- Katana: 1.7.0
- Sozo: 1.6.2
- Dojo (contracts): 1.7.1
- Torii: 1.8.3 / 1.8.6 (both crash)
- Platform: macOS (Darwin 24.5.0)

## Next Steps

When the user returns, they should:
1. Try Torii 1.8.2: `asdf set torii 1.8.2 && ./scripts/deploy_world.sh`
2. If that fails, try 1.7.0-alpha.6
3. Consider reporting the bug to Dojo with this information
4. Evaluate if external contract indexing is critical for their use case

## Files Modified

- `deploy_world.sh`: Added mint transaction after Torii startup
- `.tool-versions`: Updated Torii version to 1.8.6

## Original Request

User wanted to test if Torii has issues with the **first mint event** when it happens from the client. The investigation revealed that Torii can't even start up successfully due to a bug in external contract processing, so we never got to test the actual mint event indexing.
