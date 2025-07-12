import { inject } from '@angular/core';
import {
  CanActivateFn,
  ActivatedRouteSnapshot,
  Router
} from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { user } from 'rxfire/auth';
import { firstValueFrom } from 'rxjs';

export const perteneceAlGrupoGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot
) => {
  const firestore = inject(Firestore);
  const auth = inject(Auth);
  const router = inject(Router);

  const grupoId = route.paramMap.get('grupoId');
  if (!grupoId) {
    router.navigate(['/']);
    return false;
  }

  const currentUser = await firstValueFrom(user(auth));
  if (!currentUser) {
    router.navigate(['/login/inicio-sesion']);
    return false;
  }

  // ⚠️ Usa la colección correcta
  const grupoRef = doc(firestore, `gruposCreados/${grupoId}`);
  const grupoSnap = await getDoc(grupoRef);

  if (!grupoSnap.exists()) {
    router.navigate(['/']);
    return false;
  }

  const grupoData = grupoSnap.data() as any;
  const esMiembro = grupoData?.miembros?.includes(currentUser.uid);

  if (!esMiembro) {
    router.navigate(['/recordatorios']);
    return false;
  }

  return true;
};
