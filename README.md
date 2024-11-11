# Coin Flip Solana Example
A simple coin flip game using FEED PROTOCOL RANDOM NUMBER GENERATOR PROGRAM with solana-program rust package and @solana/web3.js package


Implementing FEED PROTOCOL RANDOM NUMBER GENERATOR PROGRAM (FPRNG) to your program is very easy. You derive the needed accounts and pass into the instruction. And then in your program make a CPI to FPRNG. 
In these simple example program we will cover every step of the implementation.
Lets say you want to build an on-chain coin flip game. 
First user chooses heads or tails and send this decision to your coinflip program. 
Your coin flip program calls FPRNG. 
FPRNG return a random number to your program.
You compare the returned random number with the user's decision in coinflip program.
Finally coin flip program logs a message according to result.
THIS ALL HAPPENS IN ONE TRANSACTION.
You can store the random number in an account in your program.
You can also try coinflip program on Devnet and Testnet.

Now lets take a look at how we use Feed Protocol RNG in coinflip game program

# Derivation of accounts



FPRNG addresses(It is the same address for devnet, testnet and mainnet-beta)

    const rng_program = new PublicKey("FEED1qspts3SRuoEyG29NMNpsTKX8yG9NGMinNC4GeYB");
    const entropy_account = new PublicKey.from("CTyyJKQHo6JhtVYBaXcota9NozebV3vHF872S8ag2TUS");
    const fee_account = new PublicKey.from("WjtcArL5m5peH8ZmAdTtyFF9qjyNxjQ2qp4Gz1YEQdy");

entropy_account and fee_account are PDAs. You can also derive them as below
   
    const entropy_account = PublicKey.findProgramAddressSync([Buffer.from("entropy")],rng_program);
    const fee_account = PublicKey.findProgramAddressSync([Buffer.from("f")],rng_program);

# Creating Instruction

Player's decision(head or tails) is serialized to pass as instruction data. 

    const players_decision = new PlayersDecision();
    players_decision.decision = head_or_tails;
        
We create our instruction, then build it and finally send. Below account are necassary to CPI FPRNG. 
You can also include the accounts you want to use in your program. 
However, when you make cpi into FPRNG the order of these accounts and their properties should be as below

    const ix = new TransactionInstruction({
      programId:coin_flip_program,
      keys:[
        {isSigner:true,isWritable:true,pubkey:payer.publicKey},
        {isSigner:false,isWritable:true,pubkey:entropy_account},
        {isSigner:false,isWritable:true,pubkey:fee_account},
        {isSigner:false,isWritable:false,pubkey:rng_program},
        {isSigner:false,isWritable:false,pubkey:SystemProgram.programId},
      ],
      data:Buffer.from(encoded)});
  
  
      const message = new TransactionMessage({
        instructions: [ix],
          payerKey: payer.publicKey,
          recentBlockhash : (await connection.getLatestBlockhash()).blockhash
        }).compileToV0Message();
    
        const tx = new VersionedTransaction(message);
        tx.sign([payer,temp]);
  
      const sig = await connection.sendTransaction(tx);
           
# Coin flip program

We get our accounts

    //credits_account is optional when you call FPRNG program. You don't need to pass into CPI. 
    //If you call FPRNG program with credits, the program will not charge per request and instead it decrease your credits.
    //You can take a look at feedprotocol.xyz to get more info about credits 

    let accounts_iter: &mut std::slice::Iter<'_, AccountInfo<'_>> = &mut accounts.iter();
    let payer: &AccountInfo<'_> = next_account_info(accounts_iter)?;
    let entropy_account: &AccountInfo<'_> = next_account_info(accounts_iter)?;
    let fee_account: &AccountInfo<'_> = next_account_info(accounts_iter)?;
    let rng_program: &AccountInfo<'_> = next_account_info(accounts_iter)?;
    let system_program: &AccountInfo<'_> = next_account_info(accounts_iter)?;
    let credits_account: &AccountInfo<'_> = next_account_info(accounts_iter)?;

Creating account metas for CPI to FPRNG

    let payer_meta = AccountMeta{ pubkey: *payer.key, is_signer: true, is_writable: true,};
    let entropy_account_meta = AccountMeta{ pubkey: *entropy_account.key, is_signer: false, is_writable: true,};
    let fee_account_meta = AccountMeta{ pubkey: *fee_account.key, is_signer: false, is_writable: true,};
    let system_program_meta = AccountMeta{ pubkey: *system_program.key, is_signer: false, is_writable: false,};
    let credits_account_meta = AccountMeta{ pubkey: *credits_account.key, is_signer: false, is_writable: true,};


Creating instruction to CPI FPRNG

    let ix:Instruction = Instruction { program_id: *rng_program.key,
       accounts: [
        payer_meta,
        entropy_account_meta,
        fee_account_meta,
        system_program_meta,
        credits_account_meta,
       ].to_vec(), data: [100].to_vec() };

CPI to FPRNG

    invoke(&ix, 
      &[
        payer.clone(),
        entropy_account.clone(),
        fee_account.clone(),
        system_program.clone()
        credits_account.clone()
        ])?;

Checking players input - zero is head, one is tails

    let players_decision: PlayersDecision = PlayersDecision::try_from_slice(&instruction_data)?;
    if players_decision.decision != 0 && players_decision.decision != 1 {panic!()}


    let returned_data:(Pubkey, Vec<u8>)= get_return_data().unwrap();

Random number is returned from the FPRNG

    let random_number:RandomNumber;
    if &returned_data.0 == rng_program.key{
      random_number = RandomNumber::try_from_slice(&returned_data.1)?;
      msg!("{}",random_number.random_number);
    }else{
        panic!();
    }

We get the mod 2 of the random number. It is either one or zero

    let head_or_tails: u64 = random_number.random_number % 2;

Then we compare with the player's decision just log a message. you can put here your program logic

    if head_or_tails != players_decision.decision {
        msg!("you lost");
    }else{
        msg!("congragulations you win");
    }
