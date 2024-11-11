import {
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  SystemProgram,
  TransactionInstruction,

} from "@solana/web3.js";

  import { serialize } from "borsh";




const connection= new Connection("https://api.devnet.solana.com","confirmed");



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


const rng_program = new PublicKey("FEED1qspts3SRuoEyG29NMNpsTKX8yG9NGMinNC4GeYB");
const coin_flip_program = new PublicKey("5uNCDQwxG8dgdFsAYMzb6DS442bLbRp85P2dAn15rt4d");

const play = async (payer:Keypair,head_or_tails:number) => {

const entropy_account = new PublicKey("CTyyJKQHo6JhtVYBaXcota9NozebV3vHF872S8ag2TUS");
const fee_account = new PublicKey("WjtcArL5m5peH8ZmAdTtyFF9qjyNxjQ2qp4Gz1YEQdy");

//credits_account is optional when you call FPRNG program. You don't need to pass into CPI. 
//If you call FPRNG program with credits, the program will not charge per request and instead it decrease your credits.
//You can take a look at feedprotocol.xyz to get more info about credits 
const credits_account =  PublicKey.findProgramAddressSync([payer.publicKey.toBytes()],rng_program)[0];

  const players_decision = new PlayersDecision();
  players_decision.decision = head_or_tails;

  const encoded = serialize(PlayersDecisionSchema,players_decision)


  const ix = new TransactionInstruction({
    programId:coin_flip_program,
    keys:[
      {isSigner:true,isWritable:true,pubkey:payer.publicKey},
      {isSigner:false,isWritable:true,pubkey:entropy_account},
      {isSigner:false,isWritable:true,pubkey:fee_account},
      {isSigner:false,isWritable:false,pubkey:rng_program},
      {isSigner:false,isWritable:false,pubkey:SystemProgram.programId},
      {isSigner:false,isWritable:true,pubkey:credits_account},
    ],
    data:Buffer.from(encoded)});


    const message = new TransactionMessage({
      instructions: [ix],
        payerKey: payer.publicKey,
        recentBlockhash : (await connection.getLatestBlockhash()).blockhash
      }).compileToV0Message();
  
      const tx = new VersionedTransaction(message);
      tx.sign([payer]);

    const sig = await connection.sendTransaction(tx);
    console.log(sig)

}
