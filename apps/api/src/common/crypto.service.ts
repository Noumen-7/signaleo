import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt } from 'crypto';
import { env } from '../env';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O/1/I pour éviter les confusions
const CODE_LENGTH = 16;

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor() {
    this.key = Buffer.from(env.encryptionKey, 'hex');
    if (this.key.length !== 32) {
      throw new Error('ENCRYPTION_KEY doit faire 32 octets (64 caractères hex)');
    }
  }

  /** AES-256-GCM → "iv.tag.ciphertext" (base64) */
  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv, tag, enc].map((b) => b.toString('base64')).join('.');
  }

  decrypt(payload: string): string {
    return this.decryptBytes(payload).toString('utf8');
  }

  /** Chiffrement binaire (pièces jointes) → même format iv.tag.ciphertext */
  encryptBytes(data: Buffer): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const enc = Buffer.concat([cipher.update(data), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv, tag, enc].map((b) => b.toString('base64')).join('.');
  }

  decryptBytes(payload: string): Buffer {
    const [iv, tag, enc] = payload.split('.').map((p) => Buffer.from(p, 'base64'));
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]);
  }

  /** Code de suivi lisible : XXXX-XXXX-XXXX-XXXX (16 caractères utiles) */
  generateTrackingCode(): string {
    let raw = '';
    for (let i = 0; i < CODE_LENGTH; i++) raw += ALPHABET[randomInt(ALPHABET.length)];
    return raw.match(/.{4}/g)!.join('-');
  }

  normalizeCode(code: string): string {
    return (code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  hashTrackingCode(code: string): string {
    return createHash('sha256')
      .update(this.normalizeCode(code) + env.trackingPepper)
      .digest('hex');
  }

  isPlausibleCode(code: string): boolean {
    return this.normalizeCode(code).length === CODE_LENGTH;
  }
}
