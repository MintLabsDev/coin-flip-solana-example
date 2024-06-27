import {
    Connection,
    Keypair,
    PublicKey,
    TransactionMessage,
    VersionedTransaction,
    SystemProgram,
    TransactionInstruction,

  } from "@solana/web3.js";
  
    import { deserialize,serialize } from "borsh";
  

  
    var BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    var bs58 = require('base-x')(BASE58);

const connection= new Connection("https://api.devnet.solana.com","confirmed");

const authority = Keypair.fromSecretKey(Uint8Array.from([153,187,227,210,27,108,215,173,44,244,
  156,74,194,28,155,122,71,217,19,208,234,242,206,140,90,56,195,207,
  73,113,207,157,220,189,39,249,130,185,164,194,196,55,144,15,84,36,233,49,66,177,100,45,220,200,
  12,207,135,110,74,254,221,39,178,75]))
  
  class CurrentFeed{
    is_init:number = 0;
    fee:number = 0
    offset1:number = 0;
    offset2:number = 0;
    offset3:number = 0;
    offset4:number = 0;
    offset5:number = 0;
    offset6:number = 0;
    offset7:number = 0;
    offset8:number = 0;
    account1:number[] = Array.from({ length: 32 }, () => 1);
    account2:number[] = Array.from({ length: 32 }, () => 1);
    account3:number[] = Array.from({ length: 32 }, () => 1);
    fallback_account:number[] = Array.from({length: 32}, () => 1);
    bump:number = 0;
  
    constructor(fields: {
      is_init:number;
      fee:number;
      offset1:number;
      offset2:number;
      offset3:number;
      offset4:number;
      offset5:number;
      offset6:number;
      offset7:number;
      offset8:number;
      account1:number[];
      account2:number[];
      account3:number[];
      fallback_account:number[];
       bump:number;
  
     } | undefined = undefined)
      {if (fields) {
        this.is_init = fields.is_init;
        this.fee = fields.fee;
        this.offset1 = fields.offset1;
        this.offset2 = fields.offset2;
        this.offset3 = fields.offset3;
        this.offset4 = fields.offset4;
        this.offset5 = fields.offset5;
        this.offset6 = fields.offset6;
        this.offset7 = fields.offset7;
        this.offset8 = fields.offset8;
        this.account1 = fields.account1;
        this.account2 = fields.account2;
        this.account3 = fields.account3;
        this.fallback_account = fields.fallback_account;
        this.bump = fields.bump;
      }
    }
  }
  const CurrentFeedSchema =new Map([
    [
      CurrentFeed,
      {
        kind: "struct",
        fields: [
          ["is_init","u8"],
          ["fee","u64"],
          ["offset1","u8"],
          ["offset2","u8"],
          ["offset3","u8"],
          ["offset4","u8"],
          ["offset5","u8"],
          ["offset6","u8"],
          ["offset7","u8"],
          ["offset8","u8"],
          ["account1",["u8",32]],
          ["account2",["u8",32]],
          ["account3",["u8",32]],
          ["fallback_account",["u8",32]],
          ["bump","u8"],
    ],
  },
  ],
  ])

  class PlayersDecision{
    decision:number = 0;

  
    constructor(fields: {
        decision:number;

  
     } | undefined = undefined)
      {if (fields) {
        this.decision = fields.decision;

      }
    }
  }
  const PlayersDecisionSchema =new Map([
    [
      PlayersDecision,
      {
        kind: "struct",
        fields: [

          ["decision","u64"],
 
    ],
  },
  ],
  ])


  const rng_program = new PublicKey("9uSwASSU59XvUS8d1UeU8EwrEzMGFdXZvQ4JSEAfcS7k");
  const coin_flip_program = new PublicKey("5uNCDQwxG8dgdFsAYMzb6DS442bLbRp85P2dAn15rt4d");

  const play = async (payer:Keypair,head_or_tails:number) => {


    const current_feeds_account =  PublicKey.findProgramAddressSync([Buffer.from("c"),Buffer.from([1])],rng_program);
    const current_feeds_account_info = await connection.getAccountInfo(current_feeds_account[0]);
    const current_feeds_account_data = deserialize(CurrentFeedSchema,CurrentFeed,current_feeds_account_info?.data!);
  
    const feed_account_1 = new PublicKey(bs58.encode(current_feeds_account_data.account1).toString());
    const feed_account_2 = new PublicKey(bs58.encode(current_feeds_account_data.account2).toString());
    const feed_account_3 = new PublicKey(bs58.encode(current_feeds_account_data.account3).toString());
  
    const fallback_account = new PublicKey(bs58.encode(current_feeds_account_data.fallback_account).toString());
  
    const temp = Keypair.generate();
  

    const players_decision = new PlayersDecision();
    players_decision.decision = head_or_tails;

    const encoded = serialize(PlayersDecisionSchema,players_decision)
  
  
    const ix = new TransactionInstruction({
      programId:coin_flip_program,
      keys:[
        {isSigner:true,isWritable:true,pubkey:payer.publicKey},
        {isSigner:false,isWritable:false,pubkey:feed_account_1},
        {isSigner:false,isWritable:false,pubkey:feed_account_2},
        {isSigner:false,isWritable:false,pubkey:feed_account_3},
        {isSigner:false,isWritable:false,pubkey:fallback_account},
        {isSigner:false,isWritable:true,pubkey:current_feeds_account[0]},
        {isSigner:true,isWritable:true,pubkey:temp.publicKey},
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
      console.log(sig)
  
  }
